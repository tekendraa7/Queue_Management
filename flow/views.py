import uuid
import hashlib
from django.contrib import messages
from django.contrib.auth.views import LoginView
from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.db import OperationalError, IntegrityError
from django.db.models import Q
from django.http import JsonResponse, HttpResponse
from django.shortcuts import render, redirect, get_object_or_404
from django.utils import timezone
from django.views.decorators.http import require_POST, require_GET
from .models import Department, Visit, Patient, Counter, AuditEvent, ACTIVE
from .forms import RegistrationForm, TransitionForm
from .access import staff_view, profile, require_role, require_department
from . import services

class StaffLoginView(LoginView):
    template_name = 'registration/login.html'
    def post(self, request, *args, **kwargs):
        # Local single-process demo throttle; use shared storage/proxy in production.
        digest = hashlib.sha256(request.META.get('REMOTE_ADDR', '').encode()).hexdigest()
        self.throttle_key = 'login-attempts:' + digest
        attempts = cache.get(self.throttle_key, 0)
        if attempts >= 10:
            return HttpResponse('Too many login attempts. Try again in 5 minutes.', status=429)
        cache.set(self.throttle_key, attempts + 1, 300)
        return super().post(request, *args, **kwargs)
    def form_valid(self, form):
        cache.delete(self.throttle_key)
        return super().form_valid(form)

def scoped_visits(user):
    visits = Visit.objects.select_related('patient', 'department', 'counter')
    p = profile(user)
    if p.role == 'operator':
        visits = visits.filter(department_id=p.department_id)
    return visits

@staff_view
def dashboard(request):
    visits = scoped_visits(request.user)
    today = visits.filter(date=timezone.localdate())
    departments = Department.objects.all()
    if profile(request.user).role == 'operator':
        departments = departments.filter(pk=profile(request.user).department_id)
    cards = []
    for d in departments:
        cards.append({'department': d, 'waiting': today.filter(department=d, status='waiting').count(),
                      'active': today.filter(department=d, status__in=['called', 'in_service']).count()})
    return render(request, 'flow/dashboard.html', {
        'today': timezone.localdate(), 'total': today.count(), 'waiting': today.filter(status='waiting').count(),
        'serving': today.filter(status__in=['called', 'in_service']).count(), 'completed': today.filter(status='completed').count(),
        'visits': today.order_by('-created_at')[:8], 'cards': cards,
        'old_visits': visits.filter(date__lt=timezone.localdate(), status__in=ACTIVE),
    })

@staff_view
def register(request):
    require_role(request.user, 'manager', 'reception')
    query = request.GET.get('q', '').strip()[:120]
    results = Patient.objects.none()
    if query:
        results = Patient.objects.filter(Q(name__icontains=query) | Q(hospital_id__icontains=query))[:20]
    selected = None
    if request.GET.get('patient'):
        try:
            selected = get_object_or_404(Patient, pk=uuid.UUID(request.GET['patient']))
        except ValueError:
            return HttpResponse('Invalid patient reference', status=400)
    initial = {'existing_patient': selected} if selected else {}
    form = RegistrationForm(request.POST or None, initial=initial)
    if request.method == 'POST' and form.is_valid():
        try:
            visit = services.register_visit(request.user, form.cleaned_data)
            messages.success(request, f'{visit.token} is registered. Print a token or open the visit.')
            return redirect('detail', pk=visit.pk)
        except ValidationError as exc:
            form.add_error(None, exc)
        except (OperationalError, IntegrityError):
            form.add_error(None, 'The record could not be saved. Check for an existing visit, then retry this form.')
    if form.is_bound:
        selected = form.cleaned_data.get('existing_patient')
    return render(request, 'flow/register.html', {'form': form, 'query': query, 'results': results, 'selected': selected})

@staff_view
def queue(request, slug):
    d = get_object_or_404(Department, slug=slug)
    require_department(request.user, d)
    visits = scoped_visits(request.user).filter(department=d, date=timezone.localdate())
    counters = []
    for c in Counter.objects.filter(department=d):
        counters.append({'counter': c, 'current': Visit.objects.select_related('patient').filter(counter=c, status__in=['called', 'in_service']).first(), 'key': uuid.uuid4()})
    return render(request, 'flow/queue.html', {'department': d, 'counters': counters,
        'waiting_visits': visits.filter(status='waiting'), 'absent_visits': visits.filter(status='absent'),
        'completed_count': visits.filter(status='completed').count()})

@require_POST
@staff_view
def call(request, pk):
    counter = get_object_or_404(Counter.objects.select_related('department'), pk=pk)
    require_department(request.user, counter.department)
    try:
        key = uuid.UUID(request.POST.get('key', ''))
        visit = services.call_next(request.user, pk, key)
        messages.success(request, f'Called {visit.token} to {counter.name}.' if visit else 'No waiting patients to call.')
    except ValueError:
        return HttpResponse('Invalid request key', status=400)
    except ValidationError as exc:
        messages.error(request, '; '.join(exc.messages))
    except (OperationalError, IntegrityError):
        messages.error(request, 'The queue is busy. Reload and check the current call before retrying.')
    return redirect('queue', slug=counter.department.slug)

@staff_view
def detail(request, pk):
    visit = get_object_or_404(scoped_visits(request.user), pk=pk)
    return render(request, 'flow/detail.html', {'visit': visit, 'events': visit.auditevent_set.select_related('actor')})

@require_POST
@staff_view
def transition(request, pk):
    get_object_or_404(scoped_visits(request.user), pk=pk)
    form = TransitionForm(request.POST)
    if not form.is_valid():
        messages.error(request, 'Invalid action or missing version. Reload the visit.')
    else:
        try:
            services.change_state(request.user, pk, **form.cleaned_data)
            messages.success(request, 'Visit updated.')
        except ValidationError as exc:
            messages.error(request, '; '.join(exc.messages))
        except (OperationalError, IntegrityError):
            messages.error(request, 'Update could not be confirmed. Reload before retrying.')
    return redirect('detail', pk=pk)

@staff_view
def ticket(request, pk):
    visit = get_object_or_404(scoped_visits(request.user), pk=pk)
    return render(request, 'flow/ticket.html', {'visit': visit})

@staff_view
def activity(request):
    require_role(request.user, 'manager')
    return render(request, 'flow/activity.html', {'events': AuditEvent.objects.select_related('actor', 'visit').all()[:100]})

@require_GET
def display(request, slug):
    return render(request, 'flow/display.html', {'department': get_object_or_404(Department, slug=slug)})

@require_GET
def display_data(request, slug):
    d = get_object_or_404(Department, slug=slug)
    visits = Visit.objects.filter(department=d, date=timezone.localdate())
    active = visits.filter(status__in=['called', 'in_service']).select_related('counter') if d.is_open else Visit.objects.none()
    return JsonResponse({'open': d.is_open, 'updated_at': timezone.now().isoformat(),
        'calls': [{'token': v.token, 'counter': v.counter.name, 'status': v.get_status_display()} for v in active.order_by('called_at')],
        'waiting': visits.filter(status='waiting').count()})
