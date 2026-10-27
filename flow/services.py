"""All queue writes go through serialized, auditable domain operations."""
import hashlib
import json
from django.db import transaction
from django.core.exceptions import ValidationError
from django.utils import timezone
from .models import (SchedulerLock, Patient, Visit, Counter, Department,
                     DailySequence, CallRequest, AuditEvent, ACTIVE)
from .access import require_role, require_department

def lock_scheduler():
    # Seeded by migration. PostgreSQL: row lock. SQLite: IMMEDIATE transaction.
    SchedulerLock.objects.select_for_update().get(pk=1)

@transaction.atomic
def register_visit(actor, data):
    require_role(actor, 'manager', 'reception')
    lock_scheduler()
    payload = {key: str(data.get(key) or '') for key in ['name', 'age', 'phone', 'hospital_id']}
    payload.update(department=str(data['department'].pk), patient=str(data['existing_patient'].pk) if data.get('existing_patient') else '')
    fingerprint = hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()
    previous = Visit.objects.filter(request_key=data['request_key']).first()
    if previous:
        # A retry can only retrieve the registration made by this actor.
        if not AuditEvent.objects.filter(visit=previous, actor=actor, action='Registered').exists():
            raise ValidationError('Registration key already used. Reload the form.')
        if previous.request_fingerprint != fingerprint:
            raise ValidationError('This form was already submitted with different details. Reload it to begin a new visit.')
        return previous
    department = Department.objects.get(pk=data['department'].pk)
    if not department.is_open:
        raise ValidationError('This department is closed. Ask the supervisor for a destination.')
    patient = data.get('existing_patient')
    if patient:
        patient = Patient.objects.get(pk=patient.pk)
    else:
        hospital_id = data.get('hospital_id', '').strip() or None
        if hospital_id and Patient.objects.filter(hospital_id=hospital_id).exists():
            raise ValidationError('Hospital ID already exists. Search and select that patient first.')
        patient = Patient.objects.create(name=data['name'], age=data.get('age'),
                                         phone=data.get('phone', ''), hospital_id=hospital_id)
    if Visit.objects.filter(patient=patient, status__in=ACTIVE).exists():
        raise ValidationError('This patient already has an active visit. Open it instead of registering again.')
    today = timezone.localdate()
    seq, _ = DailySequence.objects.get_or_create(department=department, date=today)
    seq.value += 1
    seq.save(update_fields=['value'])
    visit = Visit.objects.create(patient=patient, department=department, date=today,
                                  request_key=data['request_key'], request_fingerprint=fingerprint,
                                  token=f'{department.prefix}{seq.value:03d}')
    AuditEvent.objects.create(actor=actor, visit=visit, action='Registered')
    return visit

@transaction.atomic
def call_next(actor, counter_id, key):
    require_role(actor, 'manager', 'operator')
    lock_scheduler()
    counter = Counter.objects.select_related('department').get(pk=counter_id)
    require_department(actor, counter.department)
    prior = CallRequest.objects.filter(key=key).first()
    if prior:
        if prior.counter_id != counter.pk or prior.actor_id != actor.pk:
            raise ValidationError('This request key was already used elsewhere. Reload the queue.')
        return prior.visit
    if not counter.is_open or not counter.department.is_open:
        raise ValidationError('This counter or department is closed.')
    if Visit.objects.filter(counter=counter, status__in=['called', 'in_service']).exists():
        raise ValidationError('Finish or mark the current call absent before calling again.')
    visit = Visit.objects.filter(department=counter.department, date=timezone.localdate(), status='waiting').first()
    if visit:
        visit.status, visit.counter, visit.called_at = 'called', counter, timezone.now()
        visit.version += 1
        visit.save()
        AuditEvent.objects.create(actor=actor, visit=visit, action='Called', reason=counter.name)
    CallRequest.objects.create(key=key, actor=actor, counter=counter, visit=visit)
    return visit

@transaction.atomic
def change_state(actor, visit_id, action, version, reason=''):
    lock_scheduler()
    visit = Visit.objects.select_related('department').get(pk=visit_id)
    require_department(actor, visit.department)
    if action == 'requeue':
        require_role(actor, 'manager', 'operator', 'reception')
    else:
        require_role(actor, 'manager', 'operator')
    if visit.version != version:
        raise ValidationError('This visit changed in another window. Reload before acting.')
    allowed = {'start': ('called', 'in_service'), 'complete': ('in_service', 'completed'),
               'absent': ('called', 'absent'), 'requeue': ('absent', 'waiting')}
    reason = reason.strip()
    if action == 'cancel':
        if visit.status not in ['waiting', 'absent'] or not reason:
            raise ValidationError('Only waiting or absent visits can be cancelled, with a reason.')
        target = 'cancelled'
    else:
        if action not in allowed or visit.status != allowed[action][0]:
            raise ValidationError('This action is not valid for the current visit state.')
        target = allowed[action][1]
    if action in ['absent', 'requeue'] and not reason:
        raise ValidationError('Add a short reason for this change.')
    if action == 'start' and reason != 'identity-confirmed':
        raise ValidationError('Confirm patient identity before starting service.')
    if action in ['start', 'requeue']:
        if visit.date != timezone.localdate():
            raise ValidationError('This visit is from an earlier day. Resolve it with a supervisor.')
        if not visit.department.is_open:
            raise ValidationError('The department is closed.')
    if action == 'requeue':
        # Explicit demo policy: routine re-entry joins the end, original history retained.
        visit.queued_at = timezone.now()
    if action == 'start':
        visit.started_at = timezone.now()
    if target in ['completed', 'cancelled']:
        visit.finished_at = timezone.now()
    if target not in ['called', 'in_service']:
        visit.counter = None
    visit.status = target
    visit.version += 1
    visit.save()
    AuditEvent.objects.create(actor=actor, visit=visit, action=visit.get_status_display(), reason=reason)
    return visit
