from django.db import migrations

def seed_lock(apps, schema_editor):
    apps.get_model('flow', 'SchedulerLock').objects.using(schema_editor.connection.alias).get_or_create(pk=1)

class Migration(migrations.Migration):
    dependencies = [('flow', '0001_initial')]
    operations = [migrations.RunPython(seed_lock, migrations.RunPython.noop)]
