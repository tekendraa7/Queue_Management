from functools import wraps
from django.contrib.auth.decorators import login_required
from django.core.exceptions import PermissionDenied
from .models import StaffProfile

def profile(user):
    try:
        return user.profile
    except StaffProfile.DoesNotExist:
        raise PermissionDenied('Your account needs a SewaPath staff role.')

def require_role(user, *roles):
    if profile(user).role not in roles:
        raise PermissionDenied('This action is not included in your staff role.')

def require_department(user, department):
    p = profile(user)
    if p.role == 'operator' and p.department_id != department.pk:
        raise PermissionDenied('This department is outside your assignment.')

def staff_view(fn):
    @login_required
    @wraps(fn)
    def wrapped(request, *args, **kwargs):
        profile(request.user)
        return fn(request, *args, **kwargs)
    return wrapped
