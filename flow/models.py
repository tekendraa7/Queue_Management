import uuid
from django.conf import settings
from django.db import models
from django.db.models import Q
from django.utils import timezone

ACTIVE = ['waiting', 'called', 'in_service', 'absent']

class SchedulerLock(models.Model):
    """One deliberately global mutex for this small single-hospital prototype."""
    id = models.PositiveSmallIntegerField(primary_key=True, default=1)

class Department(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    prefix = models.CharField(max_length=5, unique=True)
    location = models.CharField(max_length=120)
    is_open = models.BooleanField(default=True)
    def __str__(self):
        return self.name

class Counter(models.Model):
    department = models.ForeignKey(Department, on_delete=models.PROTECT)
    name = models.CharField(max_length=60)
    is_open = models.BooleanField(default=True)
    def __str__(self):
        return f'{self.department.name} · {self.name}'

class StaffProfile(models.Model):
    ROLES = [('manager', 'Manager'), ('reception', 'Reception'), ('operator', 'OPD operator')]
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=20, choices=ROLES)
    department = models.ForeignKey(Department, null=True, blank=True, on_delete=models.PROTECT)

class Patient(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=120)
    hospital_id = models.CharField(max_length=40, unique=True, null=True, blank=True)
    age = models.PositiveSmallIntegerField(null=True, blank=True)
    phone = models.CharField(max_length=25, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    def __str__(self):
        return self.name

class DailySequence(models.Model):
    department = models.ForeignKey(Department, on_delete=models.PROTECT)
    date = models.DateField()
    value = models.PositiveIntegerField(default=0)
    class Meta:
        constraints = [models.UniqueConstraint(fields=['department', 'date'], name='unique_daily_sequence')]

class Visit(models.Model):
    STATES = [('waiting', 'Waiting'), ('called', 'Called'), ('in_service', 'In service'),
              ('absent', 'Temporarily absent'), ('completed', 'Completed'), ('cancelled', 'Cancelled')]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    request_key = models.UUIDField(unique=True)
    request_fingerprint = models.CharField(max_length=64, default='')
    patient = models.ForeignKey(Patient, on_delete=models.PROTECT)
    department = models.ForeignKey(Department, on_delete=models.PROTECT)
    counter = models.ForeignKey(Counter, on_delete=models.PROTECT, null=True, blank=True)
    date = models.DateField(default=timezone.localdate)
    token = models.CharField(max_length=20)
    status = models.CharField(max_length=15, choices=STATES, default='waiting')
    created_at = models.DateTimeField(default=timezone.now)
    queued_at = models.DateTimeField(default=timezone.now)
    called_at = models.DateTimeField(null=True, blank=True)
    started_at = models.DateTimeField(null=True, blank=True)
    finished_at = models.DateTimeField(null=True, blank=True)
    version = models.PositiveIntegerField(default=0)
    class Meta:
        ordering = ['queued_at', 'id']
        constraints = [
            models.UniqueConstraint(fields=['department', 'date', 'token'], name='unique_daily_token'),
            models.UniqueConstraint(fields=['patient'], condition=Q(status__in=ACTIVE), name='one_active_visit_per_patient'),
            models.UniqueConstraint(fields=['counter'], condition=Q(status__in=['called', 'in_service']), name='one_active_call_per_counter'),
            models.CheckConstraint(condition=(Q(status__in=['called', 'in_service'], counter__isnull=False) | Q(status__in=['waiting', 'absent', 'completed', 'cancelled'], counter__isnull=True)), name='counter_matches_state'),
        ]
    @property
    def wait_minutes(self):
        return max(0, int((timezone.now() - self.queued_at).total_seconds() // 60))
    @property
    def is_active(self):
        return self.status in ACTIVE

class CallRequest(models.Model):
    key = models.UUIDField(unique=True)
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    counter = models.ForeignKey(Counter, on_delete=models.PROTECT)
    visit = models.ForeignKey(Visit, null=True, on_delete=models.PROTECT)

class AuditEvent(models.Model):
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.PROTECT)
    visit = models.ForeignKey(Visit, on_delete=models.PROTECT)
    action = models.CharField(max_length=50)
    reason = models.CharField(max_length=250, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    class Meta:
        ordering = ['-created_at', '-id']
