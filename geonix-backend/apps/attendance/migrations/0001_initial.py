# Generated migration for attendance models

from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone
import uuid
import django.core.validators
from decimal import Decimal
from datetime import time


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('organizations', '0001_initial'),
        ('accounts', '0001_initial'),
        ('geofencing', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='AttendanceSettings',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('working_hours_start', models.TimeField(default=time(9, 0))),
                ('working_hours_end', models.TimeField(default=time(18, 0))),
                ('late_threshold_minutes', models.IntegerField(default=30, validators=[django.core.validators.MinValueValidator(0), django.core.validators.MaxValueValidator(180)])),
                ('auto_checkout_enabled', models.BooleanField(default=False)),
                ('auto_checkout_minutes', models.IntegerField(default=5, validators=[django.core.validators.MinValueValidator(1), django.core.validators.MaxValueValidator(60)])),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('organization', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='attendance_settings', to='organizations.organization')),
            ],
            options={
                'verbose_name_plural': 'Attendance Settings',
            },
        ),
        migrations.CreateModel(
            name='AttendanceRecord',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('date', models.DateField(default=django.utils.timezone.now)),
                ('clock_in_time', models.DateTimeField(blank=True, null=True)),
                ('clock_out_time', models.DateTimeField(blank=True, null=True)),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('checked_in', 'Checked In'), ('checked_out', 'Checked Out'), ('absent', 'Absent')], default='pending', max_length=20)),
                ('is_present', models.BooleanField(default=False)),
                ('is_late', models.BooleanField(default=False)),
                ('total_hours', models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True, validators=[django.core.validators.MinValueValidator(Decimal('0.0'))])),
                ('notes', models.TextField(blank=True, null=True)),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('organization', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='attendance_records', to='organizations.organization')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='attendance_records', to='accounts.user')),
            ],
            options={
                'ordering': ['-date'],
                'unique_together': {('user', 'date')},
            },
        ),
        migrations.CreateModel(
            name='CheckInEvent',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('event_type', models.CharField(choices=[('manual', 'Manual'), ('auto_geofence', 'Auto Geofence Entry'), ('auto_exit', 'Auto Geofence Exit')], default='manual', max_length=20)),
                ('is_check_in', models.BooleanField(default=True)),
                ('timestamp', models.DateTimeField(default=django.utils.timezone.now)),
                ('notes', models.TextField(blank=True, null=True)),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('attendance_record', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='check_in_events', to='attendance.attendancerecord')),
                ('geofence', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='check_in_events', to='geofencing.geofence')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='check_in_events', to='accounts.user')),
            ],
            options={
                'ordering': ['-timestamp'],
            },
        ),
        migrations.AddIndex(
            model_name='attendancerecord',
            index=models.Index(fields=['user', '-date'], name='attendance__user_id_date_idx'),
        ),
        migrations.AddIndex(
            model_name='attendancerecord',
            index=models.Index(fields=['organization', '-date'], name='attendance__org_date_idx'),
        ),
        migrations.AddIndex(
            model_name='attendancerecord',
            index=models.Index(fields=['is_late'], name='attendance__is_late_idx'),
        ),
        migrations.AddIndex(
            model_name='checkinevent',
            index=models.Index(fields=['user', '-timestamp'], name='attendance__event_user_idx'),
        ),
        migrations.AddIndex(
            model_name='checkinevent',
            index=models.Index(fields=['attendance_record'], name='attendance__event_rec_idx'),
        ),
    ]
