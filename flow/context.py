from .models import Department

def navigation(request):
    if request.user.is_authenticated:
        p = getattr(request.user, 'profile', None)
        departments = Department.objects.all()
        if p and p.role == 'operator':
            departments = departments.filter(pk=p.department_id)
        return {'nav_departments': departments, 'staff_profile': p}
    return {}
