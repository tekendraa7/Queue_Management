import getpass
import uuid
from datetime import timedelta
from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.utils import timezone
from flow.models import Department, Counter, StaffProfile, Visit, Patient
from flow.services import register_visit, call_next, change_state

class Command(BaseCommand):
    help = 'Create synthetic demo departments, staff and patient visits. Never resets an existing password.'
    def handle(self, *args, **options):
        User = get_user_model()
        names = ['manager', 'reception', 'opd', 'family']
        missing = [n for n in names if not User.objects.filter(username=n).exists()]
        password = None
        if missing:
            self.stdout.write('Create a shared LOCAL-DEMO password for: ' + ', '.join(missing))
            password = getpass.getpass('Choose a password (not your personal account password): ')
            if password != getpass.getpass('Confirm password: '):
                raise CommandError('Passwords do not match.')
            try:
                for name in missing:
                    validate_password(password, User(username=name))
            except ValidationError as exc:
                raise CommandError('; '.join(exc.messages))
        general, _ = Department.objects.get_or_create(slug='general-opd', defaults={'name': 'General OPD', 'prefix': 'A', 'location': 'Ground floor · Room 01'})
        family, _ = Department.objects.get_or_create(slug='family-care', defaults={'name': 'Family care', 'prefix': 'B', 'location': 'Ground floor · Room 02'})
        c1, _ = Counter.objects.get_or_create(department=general, name='Counter 1')
        Counter.objects.get_or_create(department=general, name='Counter 2')
        Counter.objects.get_or_create(department=family, name='Counter 3')
        for name, role, dep in [('manager', 'manager', None), ('reception', 'reception', None), ('opd', 'operator', general), ('family', 'operator', family)]:
            user, created = User.objects.get_or_create(username=name)
            if created:
                user.set_password(password)
                user.save()
            StaffProfile.objects.get_or_create(user=user, defaults={'role': role, 'department': dep})
        manager = User.objects.get(username='manager')
        # Never overwrite or refresh existing demo records on rerun.
        people = [('Maya Demo', 34), ('Arun Demo', 51), ('Sita Demo', 27), ('Ravi Demo', 42),
                  ('Nima Demo', 65), ('Tara Demo', 19), ('Asha Demo', 38), ('Bikash Demo', 46),
                  ('Dipa Demo', 29), ('Kiran Demo', 57)]
        created_visits = []
        for i, (name, age) in enumerate(people):
            hospital_id = f'DEMO-{i+1:03d}'
            if Patient.objects.filter(hospital_id=hospital_id).exists():
                continue
            dep = general if i < 7 else family
            visit = register_visit(manager, {'request_key': uuid.uuid4(), 'name': name, 'age': age,
                'hospital_id': hospital_id, 'phone': '', 'department': dep})
            earlier = timezone.now() - timedelta(minutes=(len(people)-i)*3)
            Visit.objects.filter(pk=visit.pk).update(created_at=earlier, queued_at=earlier)
            created_visits.append(visit)
        if len(created_visits) == len(people):
            v = call_next(manager, c1.pk, uuid.uuid4())
            v = change_state(manager, v.pk, 'start', v.version, 'identity-confirmed')
            change_state(manager, v.pk, 'complete', v.version)
            v = call_next(manager, c1.pk, uuid.uuid4())
            change_state(manager, v.pk, 'absent', v.version, 'Synthetic example: patient stepped away')
            v = call_next(manager, c1.pk, uuid.uuid4())
            change_state(manager, v.pk, 'start', v.version, 'identity-confirmed')
        self.stdout.write(self.style.SUCCESS('Demo ready. Accounts: manager, reception, opd, family. Existing passwords are unchanged.'))
        self.stdout.write('Run: python manage.py runserver 127.0.0.1:8000')
