import uuid
from django import forms
from .models import Patient, Department

class RegistrationForm(forms.Form):
    request_key = forms.UUIDField(widget=forms.HiddenInput)
    existing_patient = forms.ModelChoiceField(queryset=Patient.objects.all(), required=False, widget=forms.HiddenInput)
    name = forms.CharField(label='Full name', max_length=120, required=False)
    hospital_id = forms.CharField(label='Existing hospital ID (optional)', max_length=40, required=False)
    age = forms.IntegerField(label='Age in years (optional)', min_value=0, max_value=125, required=False)
    phone = forms.CharField(label='Phone (optional)', max_length=25, required=False)
    department = forms.ModelChoiceField(queryset=Department.objects.filter(is_open=True))
    confirmed = forms.BooleanField(label='I checked the identity and possible duplicate records.')
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['request_key'].initial = uuid.uuid4
    def clean(self):
        data = super().clean()
        if not data.get('existing_patient') and not data.get('name', '').strip():
            self.add_error('name', 'Enter a name or select an existing patient.')
        return data

class TransitionForm(forms.Form):
    version = forms.IntegerField(min_value=0)
    action = forms.ChoiceField(choices=[(x, x) for x in ['start', 'complete', 'absent', 'requeue', 'cancel']])
    reason = forms.CharField(max_length=250, required=False)
