import uuid
from datetime import timedelta
from concurrent.futures import ThreadPoolExecutor
from threading import Barrier
from django.test import TestCase, TransactionTestCase, Client
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError, PermissionDenied
from django.db import close_old_connections, OperationalError
from django.utils import timezone
from django.core.cache import cache
from django.urls import reverse
from .models import Department, Counter, StaffProfile, Visit, Patient, AuditEvent, SchedulerLock
from .services import register_visit, call_next, change_state

class SetupMixin:
    def setup_data(self):
        SchedulerLock.objects.get_or_create(pk=1)
        self.dep = Department.objects.create(name='General OPD', slug='general-opd', prefix='A', location='Room 1')
        self.other = Department.objects.create(name='Other', slug='other', prefix='B', location='Room 2')
        self.counter = Counter.objects.create(department=self.dep, name='Counter 1')
        self.second = Counter.objects.create(department=self.dep, name='Counter 2')
        User = get_user_model()
        self.manager = User.objects.create_user('manager', password='Example-for-tests-927!')
        self.reception = User.objects.create_user('reception', password='Example-for-tests-927!')
        self.operator = User.objects.create_user('operator', password='Example-for-tests-927!')
        StaffProfile.objects.create(user=self.manager, role='manager')
        StaffProfile.objects.create(user=self.reception, role='reception')
        StaffProfile.objects.create(user=self.operator, role='operator', department=self.other)
    def data(self, **kwargs):
        return {'request_key': uuid.uuid4(), 'name': 'Synthetic Person', 'age': 33,
                'phone': '', 'hospital_id': '', 'department': self.dep, **kwargs}
    def visit(self, **kwargs):
        return register_visit(self.manager, self.data(**kwargs))

class WorkflowTests(SetupMixin, TestCase):
    def setUp(self): self.setup_data()
    def test_registration_retry_creates_one_record(self):
        data = self.data()
        first = register_visit(self.manager, data)
        second = register_visit(self.manager, data)
        self.assertEqual(first.pk, second.pk)
        self.assertEqual(Patient.objects.count(), 1)
        self.assertEqual(AuditEvent.objects.count(), 1)
    def test_active_patient_cannot_register_twice(self):
        first = self.visit()
        with self.assertRaises(ValidationError): self.visit(existing_patient=first.patient)
        self.assertEqual(Visit.objects.count(), 1)
    def test_changed_registration_payload_cannot_reuse_key(self):
        data = self.data()
        register_visit(self.manager, data)
        data['name'] = 'Different Person'
        with self.assertRaises(ValidationError): register_visit(self.manager, data)
        self.assertEqual(Patient.objects.count(), 1)
    def test_duplicate_hospital_id_requires_selection(self):
        self.visit(hospital_id='EXISTING')
        with self.assertRaises(ValidationError): self.visit(hospital_id='EXISTING')
        self.assertEqual(Patient.objects.count(), 1)
    def test_failed_registration_does_not_leave_patient(self):
        self.dep.is_open = False; self.dep.save()
        with self.assertRaises(ValidationError): self.visit()
        self.assertEqual(Patient.objects.count(), 0)
    def test_fifo_and_call_idempotency(self):
        first = self.visit(); self.visit()
        key = uuid.uuid4()
        called = call_next(self.manager, self.counter.pk, key)
        again = call_next(self.manager, self.counter.pk, key)
        self.assertEqual(called.pk, first.pk)
        self.assertEqual(called.pk, again.pk)
        self.assertEqual(Visit.objects.filter(status='called').count(), 1)
    def test_occupied_counter_cannot_call_twice(self):
        self.visit(); self.visit()
        call_next(self.manager, self.counter.pk, uuid.uuid4())
        with self.assertRaises(ValidationError): call_next(self.manager, self.counter.pk, uuid.uuid4())
    def test_different_counters_get_different_patients(self):
        self.visit(); self.visit()
        a = call_next(self.manager, self.counter.pk, uuid.uuid4())
        b = call_next(self.manager, self.second.pk, uuid.uuid4())
        self.assertNotEqual(a.pk, b.pk)
    def test_complete_lifecycle_and_audit(self):
        v = self.visit()
        v = call_next(self.manager, self.counter.pk, uuid.uuid4())
        v = change_state(self.manager, v.pk, 'start', v.version, 'identity-confirmed')
        v = change_state(self.manager, v.pk, 'complete', v.version)
        self.assertEqual(v.status, 'completed')
        self.assertIsNone(v.counter_id)
        self.assertIsNotNone(v.finished_at)
        self.assertEqual(v.auditevent_set.count(), 4)
    def test_identity_confirmation_required(self):
        self.visit(); v = call_next(self.manager, self.counter.pk, uuid.uuid4())
        with self.assertRaises(ValidationError): change_state(self.manager, v.pk, 'start', v.version)
    def test_stale_version_rejected(self):
        v = self.visit(); call_next(self.manager, self.counter.pk, uuid.uuid4())
        with self.assertRaises(ValidationError): change_state(self.manager, v.pk, 'start', v.version, 'identity-confirmed')
    def test_cannot_complete_waiting_visit(self):
        v = self.visit()
        with self.assertRaises(ValidationError): change_state(self.manager, v.pk, 'complete', v.version)
    def test_absent_reentry_goes_to_end(self):
        self.visit(); second = self.visit()
        v = call_next(self.manager, self.counter.pk, uuid.uuid4())
        v = change_state(self.manager, v.pk, 'absent', v.version, 'Two assisted calls')
        change_state(self.reception, v.pk, 'requeue', v.version, 'Patient returned')
        self.assertEqual(call_next(self.manager, self.counter.pk, uuid.uuid4()).pk, second.pk)
    def test_cancel_requires_reason(self):
        v = self.visit()
        with self.assertRaises(ValidationError): change_state(self.manager, v.pk, 'cancel', v.version)
        self.assertEqual(change_state(self.manager, v.pk, 'cancel', v.version, 'Patient left').status, 'cancelled')
    def test_prior_day_not_called(self):
        v = self.visit(); Visit.objects.filter(pk=v.pk).update(date=timezone.localdate()-timedelta(days=1))
        self.assertIsNone(call_next(self.manager, self.counter.pk, uuid.uuid4()))
    def test_reception_cannot_call(self):
        with self.assertRaises(PermissionDenied): call_next(self.reception, self.counter.pk, uuid.uuid4())
    def test_operator_cannot_access_other_department(self):
        with self.assertRaises(PermissionDenied): call_next(self.operator, self.counter.pk, uuid.uuid4())
    def test_closed_counter_not_called(self):
        self.visit(); self.counter.is_open = False; self.counter.save()
        with self.assertRaises(ValidationError): call_next(self.manager, self.counter.pk, uuid.uuid4())
    def test_reused_call_key_wrong_counter_rejected(self):
        self.visit(); key = uuid.uuid4(); call_next(self.manager, self.counter.pk, key)
        with self.assertRaises(ValidationError): call_next(self.manager, self.second.pk, key)

class PageTests(SetupMixin, TestCase):
    def setUp(self): self.setup_data(); cache.clear()
    def test_private_pages_require_login(self):
        v = self.visit()
        for url in ['/', '/register/', '/queue/general-opd/', '/activity/', reverse('detail', args=[v.pk]), reverse('ticket', args=[v.pk])]:
            self.assertEqual(self.client.get(url).status_code, 302)
    def test_pages_render_and_private_no_store(self):
        v = self.visit(); self.client.force_login(self.manager)
        for url in ['/', '/register/', '/queue/general-opd/', '/activity/', reverse('detail', args=[v.pk]), reverse('ticket', args=[v.pk])]:
            r = self.client.get(url)
            self.assertEqual(r.status_code, 200, url)
            self.assertIn('no-store', r['Cache-Control'])
    def test_public_display_contains_no_identity(self):
        v = self.visit(name='VeryPrivateName', hospital_id='PRIVATE-ID', phone='9841111111')
        call_next(self.manager, self.counter.pk, uuid.uuid4())
        r = self.client.get('/api/display/general-opd/')
        self.assertEqual(r.status_code, 200)
        self.assertContains(r, v.token)
        for secret in [v.patient.name, 'PRIVATE-ID', '9841111111', str(v.pk), str(v.patient_id)]:
            self.assertNotContains(r, secret)
    def test_operator_cannot_view_other_department_visit(self):
        v = self.visit(); self.client.force_login(self.operator)
        self.assertEqual(self.client.get(reverse('detail', args=[v.pk])).status_code, 404)
        self.assertEqual(self.client.get('/queue/general-opd/').status_code, 403)
        self.assertEqual(self.client.get('/register/').status_code, 403)
        self.assertEqual(self.client.get('/activity/').status_code, 403)
    def test_csrf_is_enforced(self):
        client = Client(enforce_csrf_checks=True); client.force_login(self.manager)
        r = client.post(reverse('call', args=[self.counter.pk]), {'key': uuid.uuid4()})
        self.assertEqual(r.status_code, 403)
    def test_call_is_post_only(self):
        self.client.force_login(self.manager)
        self.assertEqual(self.client.get(reverse('call', args=[self.counter.pk])).status_code, 405)
    def test_bad_version_does_not_crash(self):
        v = self.visit(); self.client.force_login(self.manager)
        r = self.client.post(reverse('transition', args=[v.pk]), {'version': 'bad', 'action': 'cancel', 'reason': 'left'})
        self.assertEqual(r.status_code, 302)
        v.refresh_from_db(); self.assertEqual(v.status, 'waiting')
    def test_registration_post_no_phone_required(self):
        self.client.force_login(self.reception)
        r = self.client.post('/register/', {'request_key': uuid.uuid4(), 'name': 'New Demo', 'department': self.dep.pk, 'confirmed': 'on'})
        self.assertEqual(r.status_code, 302)
        self.assertEqual(Patient.objects.get().phone, '')
    def test_html_in_name_is_escaped(self):
        self.visit(name='<script>alert(1)</script>'); self.client.force_login(self.manager)
        r = self.client.get('/')
        self.assertContains(r, '&lt;script&gt;')
        self.assertNotContains(r, '<script>alert(1)</script>')
    def test_login_throttle(self):
        for _ in range(10): self.client.post('/login/', {'username': 'x', 'password': 'bad'})
        self.assertEqual(self.client.post('/login/', {'username': 'x', 'password': 'bad'}).status_code, 429)

class ConcurrentCallTests(SetupMixin, TransactionTestCase):
    def setUp(self): self.setup_data()
    def test_two_simultaneous_calls_never_reserve_one_visit_twice(self):
        self.visit()
        gate = Barrier(2)
        actor_id = self.manager.pk
        def run(counter_id):
            close_old_connections()
            try:
                actor = get_user_model().objects.get(pk=actor_id)
                gate.wait(timeout=10)
                try:
                    v = call_next(actor, counter_id, uuid.uuid4())
                    return str(v.pk) if v else 'empty'
                except OperationalError:
                    # In-memory SQLite may fail fast on a simultaneous transaction.
                    # The HTTP layer reports a retry; it must never duplicate a call.
                    return 'retry'
            finally:
                close_old_connections()
        with ThreadPoolExecutor(max_workers=2) as executor:
            results = list(executor.map(run, [self.counter.pk, self.second.pk]))
        self.assertEqual(Visit.objects.filter(status='called').count(), 1, results)
        self.assertEqual(len([r for r in results if r not in ['empty', 'retry']]), 1, results)
