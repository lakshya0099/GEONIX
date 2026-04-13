# Generated migration for geofencing models

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone
import uuid
import django.core.validators


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('organizations', '0001_initial'),
        ('accounts', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Geofence',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=255)),
                ('description', models.TextField(blank=True, null=True)),
                ('latitude', models.DecimalField(decimal_places=6, max_digits=9)),
                ('longitude', models.DecimalField(decimal_places=6, max_digits=9)),
                ('radius_meters', models.IntegerField(default=100, validators=[django.core.validators.MinValueValidator(10)])),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('created_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='created_geofences', to='accounts.user')),
                ('organization', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='geofences', to='organizations.organization')),
            ],
            options={
                'verbose_name_plural': 'Geofences',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='LocationUpdate',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('latitude', models.DecimalField(decimal_places=6, max_digits=9)),
                ('longitude', models.DecimalField(decimal_places=6, max_digits=9)),
                ('accuracy', models.IntegerField(blank=True, null=True)),
                ('is_inside_geofence', models.BooleanField(default=False)),
                ('timestamp', models.DateTimeField(default=django.utils.timezone.now)),
                ('geofence', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='location_updates', to='geofencing.geofence')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='location_updates', to='accounts.user')),
            ],
            options={
                'ordering': ['-timestamp'],
            },
        ),
        migrations.AddIndex(
            model_name='locationupdate',
            index=models.Index(fields=['user', '-timestamp'], name='geofencing__user_id_3c4f2b_idx'),
        ),
        migrations.AddIndex(
            model_name='locationupdate',
            index=models.Index(fields=['geofence', '-timestamp'], name='geofencing__geofence_3c4f2b_idx'),
        ),
    ]
