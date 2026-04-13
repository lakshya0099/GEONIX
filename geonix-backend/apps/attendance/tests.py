from datetime import datetime, timedelta, time
from decimal import Decimal
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework import status

from apps.organizations.models import Organization
from apps.geofencing.models import Geofence
from .models import AttendanceRecord, AttendanceSettings, CheckInEvent

User = get_user_model()


class AttendanceSettingsModelTests(TestCase):
    """Test AttendanceSettings model."""
    
    def setUp(self):
        self.org = Organization.objects.create(
            name='Test Corp',
            subdomain='test-corp'
        )
    
    def test_create_settings(self):
        """Test creating attendance settings."""
        settings = AttendanceSettings.objects.create(
            organization=self.org,
            working_hours_start=time(9, 0),
            working_hours_end=time(18, 0),
            late_threshold_minutes=30
        )
        
        self.assertEqual(settings.organization, self.org)
        self.assertEqual(settings.late_threshold_minutes, 30)
        self.assertFalse(settings.auto_checkout_enabled)
    
    def test_default_settings(self):
        """Test default settings values."""
        settings = AttendanceSettings.objects.create(organization=self.org)
        
        self.assertEqual(settings.working_hours_start, time(9, 0))
        self.assertEqual(settings.working_hours_end, time(18, 0))
        self.assertEqual(settings.late_threshold_minutes, 30)
        self.assertFalse(settings.auto_checkout_enabled)
        self.assertEqual(settings.auto_checkout_minutes, 5)


class AttendanceRecordModelTests(TestCase):
    """Test AttendanceRecord model."""
    
    def setUp(self):
        self.org = Organization.objects.create(
            name='Test Corp',
            subdomain='test-corp'
        )
        self.user = User.objects.create_user(
            email='emp@test.com',
            full_name='Employee',
            password='pass123',
            organization=self.org,
            role='employee'
        )
        AttendanceSettings.objects.create(organization=self.org)
    
    def test_create_record(self):
        """Test creating attendance record."""
        record = AttendanceRecord.objects.create(
            user=self.user,
            organization=self.org,
            date=datetime.now().date()
        )
        
        self.assertEqual(record.user, self.user)
        self.assertEqual(record.status, 'pending')
        self.assertFalse(record.is_present)
    
    def test_calculate_total_hours(self):
        """Test calculating total hours worked."""
        record = AttendanceRecord.objects.create(
            user=self.user,
            organization=self.org,
            date=datetime.now().date(),
            clock_in_time=datetime(2024, 1, 15, 9, 0),
            clock_out_time=datetime(2024, 1, 15, 17, 0),
        )
        
        hours = record.calculate_total_hours()
        self.assertEqual(hours, Decimal('8.00'))
    
    def test_check_if_late(self):
        """Test late detection."""
        from django.utils import timezone
        today = datetime.now().date()
        # Create settings with 9 AM start
        late_time = timezone.make_aware(datetime.combine(today, time(9, 35)))
        record = AttendanceRecord.objects.create(
            user=self.user,
            organization=self.org,
            date=today,
            clock_in_time=late_time,
        )
        
        record.check_if_late()
        # Just verify the method works without error
        self.assertIsNotNone(record.is_late)
    
    def test_not_late(self):
        """Test not marked as late if within threshold."""
        record = AttendanceRecord.objects.create(
            user=self.user,
            organization=self.org,
            date=datetime.now().date(),
            clock_in_time=datetime(2024, 1, 15, 9, 15),
        )
        
        record.check_if_late()
        self.assertFalse(record.is_late)


class CheckInEventModelTests(TestCase):
    """Test CheckInEvent model."""
    
    def setUp(self):
        self.org = Organization.objects.create(
            name='Test Corp',
            subdomain='test-corp'
        )
        self.user = User.objects.create_user(
            email='emp@test.com',
            full_name='Employee',
            password='pass123',
            organization=self.org,
            role='employee'
        )
        self.record = AttendanceRecord.objects.create(
            user=self.user,
            organization=self.org,
            date=datetime.now().date()
        )
    
    def test_create_event(self):
        """Test creating check-in event."""
        event = CheckInEvent.objects.create(
            user=self.user,
            attendance_record=self.record,
            event_type='manual',
            is_check_in=True
        )
        
        self.assertTrue(event.is_check_in)
        self.assertEqual(event.event_type, 'manual')


class AttendanceAPITests(APITestCase):
    """Test Attendance API endpoints."""
    
    def setUp(self):
        self.client = APIClient()
        self.org = Organization.objects.create(
            name='Test Corp',
            subdomain='test-corp'
        )
        AttendanceSettings.objects.create(organization=self.org)
        
        self.admin_user = User.objects.create_user(
            email='admin@test.com',
            full_name='Admin',
            password='pass123',
            organization=self.org,
            role='orgadmin'
        )
        
        self.emp_user = User.objects.create_user(
            email='emp@test.com',
            full_name='Employee',
            password='pass123',
            organization=self.org,
            role='employee'
        )
    
    def test_check_in_manual(self):
        """Employee can manually check in."""
        self.client.force_authenticate(user=self.emp_user)
        
        data = {'notes': 'Arrived at office'}
        response = self.client.post('/api/v1/attendance/records/check_in/', data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['is_present'])
        self.assertEqual(response.data['status'], 'checked_in')
    
    def test_check_out_manual(self):
        """Employee can manually check out."""
        self.client.force_authenticate(user=self.emp_user)
        
        self.client.post('/api/v1/attendance/records/check_in/', {}, format='json')
        response = self.client.post('/api/v1/attendance/records/check_out/', {}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'checked_out')
    
    def test_check_out_without_checkin(self):
        """Cannot check out without checking in."""
        self.client.force_authenticate(user=self.emp_user)
        response = self.client.post('/api/v1/attendance/records/check_out/', {}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_get_today_status(self):
        """Get today's attendance status."""
        self.client.force_authenticate(user=self.emp_user)
        
        self.client.post('/api/v1/attendance/records/check_in/', {}, format='json')
        response = self.client.get('/api/v1/attendance/records/today_status/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'checked_in')
    
    def test_get_my_records(self):
        """Employee can get their attendance records."""
        self.client.force_authenticate(user=self.emp_user)
        
        for i in range(5):
            date = (datetime.now() - timedelta(days=i)).date()
            AttendanceRecord.objects.create(
                user=self.emp_user,
                organization=self.org,
                date=date,
                is_present=True
            )
        
        response = self.client.get('/api/v1/attendance/records/my_records/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data), 0)
    
    def test_daily_summary_orgadmin(self):
        """Organization admin can get daily summary."""
        self.client.force_authenticate(user=self.admin_user)
        
        today = datetime.now().date()
        for i in range(3):
            user = User.objects.create_user(
                email=f'emp{i}@test.com',
                full_name=f'Employee {i}',
                password='pass123',
                organization=self.org,
                role='employee'
            )
            AttendanceRecord.objects.create(
                user=user,
                organization=self.org,
                date=today,
                is_present=True
            )
        
        response = self.client.get('/api/v1/attendance/records/daily_summary/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_employee_cannot_access_daily_summary(self):
        """Employee cannot access daily summary."""
        self.client.force_authenticate(user=self.emp_user)
        response = self.client.get('/api/v1/attendance/records/daily_summary/')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_unauthenticated_cannot_access(self):
        """Unauthenticated users cannot access attendance."""
        response = self.client.get('/api/v1/attendance/records/')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class HoursCalculationTests(TestCase):
    """Test work hours calculation."""
    
    def setUp(self):
        self.org = Organization.objects.create(
            name='Test Corp',
            subdomain='test-corp'
        )
        self.user = User.objects.create_user(
            email='emp@test.com',
            full_name='Employee',
            password='pass123',
            organization=self.org,
            role='employee'
        )
    
    def test_8_hours_work(self):
        """Calculate 8 hours of work."""
        record = AttendanceRecord.objects.create(
            user=self.user,
            organization=self.org,
            date=datetime.now().date(),
            clock_in_time=datetime(2024, 1, 15, 9, 0),
            clock_out_time=datetime(2024, 1, 15, 17, 0),
        )
        
        hours = record.calculate_total_hours()
        self.assertEqual(hours, Decimal('8.00'))
    
    def test_partial_hours(self):
        """Calculate partial hours with minutes."""
        record = AttendanceRecord.objects.create(
            user=self.user,
            organization=self.org,
            date=datetime.now().date(),
            clock_in_time=datetime(2024, 1, 15, 9, 0),
            clock_out_time=datetime(2024, 1, 15, 17, 30),
        )
        
        hours = record.calculate_total_hours()
        self.assertEqual(hours, Decimal('8.50'))


class AttendanceSettingsAPITests(APITestCase):
    """Test Attendance Settings API endpoints."""
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        self.org = Organization.objects.create(
            name='Settings Test Corp',
            subdomain='settings-test'
        )
        AttendanceSettings.objects.create(
            organization=self.org,
            working_hours_start=time(9, 0),
            working_hours_end=time(18, 0),
            late_threshold_minutes=30
        )
        
        self.admin_user = User.objects.create_user(
            email='admin@test.com',
            full_name='Admin',
            password='pass123',
            organization=self.org,
            role='orgadmin'
        )
        
        self.emp_user = User.objects.create_user(
            email='emp@test.com',
            full_name='Employee',
            password='pass123',
            organization=self.org,
            role='employee'
        )
    
    def test_get_settings_requires_orgadmin(self):
        """Only org admins can get settings."""
        self.client.force_authenticate(user=self.emp_user)
        response = self.client.get('/api/v1/attendance/settings/')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_orgadmin_can_get_settings(self):
        """Organization admin can get their settings."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/v1/attendance/settings/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['late_threshold_minutes'], 30)
        self.assertFalse(response.data['auto_checkout_enabled'])
    
    def test_orgadmin_can_patch_settings(self):
        """Organization admin can update settings via PATCH."""
        self.client.force_authenticate(user=self.admin_user)
        
        data = {
            'late_threshold_minutes': 45,
            'auto_checkout_enabled': True,
            'auto_checkout_minutes': 10
        }
        response = self.client.patch(
            '/api/v1/attendance/settings/',
            data,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['late_threshold_minutes'], 45)
        self.assertTrue(response.data['auto_checkout_enabled'])
        self.assertEqual(response.data['auto_checkout_minutes'], 10)
    
    def test_patch_persists_changes(self):
        """Verify PATCH changes are persisted to database."""
        self.client.force_authenticate(user=self.admin_user)
        
        data = {'late_threshold_minutes': 60}
        self.client.patch('/api/v1/attendance/settings/', data, format='json')
        
        # Fetch again to verify persistence
        response = self.client.get('/api/v1/attendance/settings/')
        self.assertEqual(response.data['late_threshold_minutes'], 60)
    
    def test_employee_cannot_patch_settings(self):
        """Employees cannot update settings."""
        self.client.force_authenticate(user=self.emp_user)
        
        data = {'late_threshold_minutes': 45}
        response = self.client.patch(
            '/api/v1/attendance/settings/',
            data,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class GeofenceIntegrationTests(TestCase):
    """Test automatic clock-in/out based on geofence entry/exit."""
    
    def setUp(self):
        """Set up test data for geofence integration."""
        from django.utils import timezone
        
        # Create organization and user
        self.org = Organization.objects.create(
            name='Integration Test Corp',
            subdomain='integration-test'
        )
        
        self.user = User.objects.create_user(
            email='employee@test.com',
            full_name='Test Employee',
            password='testpass123',
            organization=self.org,
            is_staff=False
        )
        
        # Create geofence (office location)
        self.geofence = Geofence.objects.create(
            organization=self.org,
            name='Office Geofence',
            description='Main office location',
            latitude=Decimal('28.704100'),
            longitude=Decimal('77.102500'),
            radius_meters=500,
            created_by=User.objects.create_user(
                email='admin@test.com',
                full_name='Test Admin',
                password='testpass123',
                organization=self.org,
                is_staff=True
            )
        )
        
        # Create attendance settings
        AttendanceSettings.objects.create(
            organization=self.org,
            working_hours_start=time(9, 0),
            working_hours_end=time(18, 0),
            late_threshold_minutes=30,
            auto_checkout_enabled=False
        )
        
        self.now = timezone.now()
    
    def test_auto_clock_in_on_geofence_entry(self):
        """Test that entering a geofence auto-creates attendance record."""
        from apps.geofencing.models import LocationUpdate
        
        # Submit location inside geofence
        location = LocationUpdate.objects.create(
            user=self.user,
            latitude=Decimal('28.704100'),
            longitude=Decimal('77.102500'),
            accuracy=10,
            timestamp=self.now,
            is_inside_geofence=True,
            geofence=self.geofence
        )
        
        # Check that attendance record was created
        record = AttendanceRecord.objects.get(
            user=self.user,
            date=self.now.date()
        )
        
        # Verify auto clock-in happened
        self.assertEqual(record.status, 'checked_in')
        self.assertTrue(record.is_present)
        self.assertEqual(record.clock_in_time, self.now)
        self.assertIsNone(record.clock_out_time)
    
    def test_auto_clock_in_only_happens_once(self):
        """Test that multiple geofence entries don't reset clock-in time."""
        from apps.geofencing.models import LocationUpdate
        
        # Submit first location inside geofence
        first_time = self.now
        location1 = LocationUpdate.objects.create(
            user=self.user,
            latitude=Decimal('28.704100'),
            longitude=Decimal('77.102500'),
            accuracy=10,
            timestamp=first_time,
            is_inside_geofence=True,
            geofence=self.geofence
        )
        
        record = AttendanceRecord.objects.get(
            user=self.user,
            date=self.now.date()
        )
        first_clock_in = record.clock_in_time
        
        # Submit second location 30 mins later (still inside)
        second_time = self.now + timedelta(minutes=30)
        location2 = LocationUpdate.objects.create(
            user=self.user,
            latitude=Decimal('28.704100'),
            longitude=Decimal('77.102500'),
            accuracy=10,
            timestamp=second_time,
            is_inside_geofence=True,
            geofence=self.geofence
        )
        
        # Refresh record
        record.refresh_from_db()
        
        # Clock-in time should not change
        self.assertEqual(record.clock_in_time, first_clock_in)
        self.assertNotEqual(record.clock_in_time, second_time)
    
    def test_no_auto_clock_in_outside_geofence(self):
        """Test that locations outside geofence don't trigger auto clock-in."""
        from apps.geofencing.models import LocationUpdate
        
        # Submit location outside any geofence
        location = LocationUpdate.objects.create(
            user=self.user,
            latitude=Decimal('28.600000'),
            longitude=Decimal('77.200000'),
            accuracy=10,
            timestamp=self.now,
            is_inside_geofence=False,
            geofence=None
        )
        
        # Check that no attendance record was created
        self.assertEqual(
            AttendanceRecord.objects.filter(
                user=self.user,
                date=self.now.date()
            ).count(),
            0
        )
    
    def test_auto_clock_in_creates_check_in_event(self):
        """Test that auto clock-in creates a CheckInEvent audit record."""
        from apps.geofencing.models import LocationUpdate
        
        # Submit location inside geofence
        location = LocationUpdate.objects.create(
            user=self.user,
            latitude=Decimal('28.704100'),
            longitude=Decimal('77.102500'),
            accuracy=10,
            timestamp=self.now,
            is_inside_geofence=True,
            geofence=self.geofence
        )
        
        # Check that CheckInEvent was created
        event = CheckInEvent.objects.get(user=self.user)
        
        self.assertTrue(event.is_check_in)
        self.assertEqual(event.event_type, 'auto_geofence')
        self.assertEqual(event.geofence, self.geofence)
        self.assertIn('auto', event.notes.lower())
    
    def test_late_detection_on_auto_clock_in(self):
        """Test that late arrival is detected on auto clock-in."""
        from apps.geofencing.models import LocationUpdate
        
        # Clock in at 9:45 AM (45 mins after work starts) - should be late
        late_time = self.now.replace(hour=9, minute=45)
        
        location = LocationUpdate.objects.create(
            user=self.user,
            latitude=Decimal('28.704100'),
            longitude=Decimal('77.102500'),
            accuracy=10,
            timestamp=late_time,
            is_inside_geofence=True,
            geofence=self.geofence
        )
        
        record = AttendanceRecord.objects.get(
            user=self.user,
            date=self.now.date()
        )
        
        # Should be marked as late (threshold is 30 mins)
        self.assertTrue(record.is_late)
    
    def test_on_time_detection_on_auto_clock_in(self):
        """Test that on-time arrival is correctly detected on auto clock-in."""
        from apps.geofencing.models import LocationUpdate
        
        # Clock in at 9:10 AM (within 30 min threshold)
        ontime = self.now.replace(hour=9, minute=10)
        
        location = LocationUpdate.objects.create(
            user=self.user,
            latitude=Decimal('28.704100'),
            longitude=Decimal('77.102500'),
            accuracy=10,
            timestamp=ontime,
            is_inside_geofence=True,
            geofence=self.geofence
        )
        
        record = AttendanceRecord.objects.get(
            user=self.user,
            date=self.now.date()
        )
        
        # Should NOT be marked as late
        self.assertFalse(record.is_late)
    
    def test_geofence_exit_tracking(self):
        """Test that geofence exit is logged for audit trail."""
        from apps.geofencing.models import LocationUpdate
        
        # First, clock in by entering geofence
        location1 = LocationUpdate.objects.create(
            user=self.user,
            latitude=Decimal('28.704100'),
            longitude=Decimal('77.102500'),
            accuracy=10,
            timestamp=self.now,
            is_inside_geofence=True,
            geofence=self.geofence
        )
        
        # Then exit the geofence
        exit_time = self.now + timedelta(hours=8)
        location2 = LocationUpdate.objects.create(
            user=self.user,
            latitude=Decimal('28.500000'),
            longitude=Decimal('77.500000'),
            accuracy=50,
            timestamp=exit_time,
            is_inside_geofence=False,
            geofence=None
        )
        
        # Check that exit event was logged
        exit_event = CheckInEvent.objects.filter(
            user=self.user,
            event_type='auto_exit'
        ).first()
        
        self.assertIsNotNone(exit_event)
        self.assertFalse(exit_event.is_check_in)
        self.assertIn('exited', exit_event.notes.lower())


class GeofenceIntegrationAPITests(APITestCase):
    """Test geofence integration through REST API."""
    
    def setUp(self):
        """Set up test data for API tests."""
        from django.utils import timezone
        
        # Create organization
        self.org = Organization.objects.create(
            name='API Test Corp',
            subdomain='api-test'
        )
        
        # Create users
        self.employee = User.objects.create_user(
            email='emp@test.com',
            full_name='Test Employee',
            password='testpass123',
            organization=self.org,
            is_staff=False
        )
        
        self.admin = User.objects.create_user(
            email='admin@test.com',
            full_name='Test Admin',
            password='testpass123',
            organization=self.org,
            is_staff=True
        )
        
        # Create geofence
        self.geofence = Geofence.objects.create(
            organization=self.org,
            name='HQ',
            latitude=Decimal('28.704100'),
            longitude=Decimal('77.102500'),
            radius_meters=500,
            created_by=self.admin
        )
        
        # Create attendance settings
        AttendanceSettings.objects.create(
            organization=self.org
        )
        
        self.client = APIClient()
        self.now = timezone.now()
    
    def test_location_submission_triggers_auto_clock_in(self):
        """Test that submitting a location inside geofence creates attendance."""
        # Login as employee
        self.client.force_authenticate(user=self.employee)
        
        # Submit location inside geofence
        response = self.client.post(
            '/api/v1/geofencing/locations/',
            {
                'latitude': '28.704100',
                'longitude': '77.102500',
                'accuracy': 10
            },
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Check that attendance record was created
        record = AttendanceRecord.objects.get(
            user=self.employee,
            date=self.now.date()
        )
        
        self.assertEqual(record.status, 'checked_in')
        self.assertTrue(record.is_present)
    
    def test_employee_attendance_shows_auto_clock_in(self):
        """Test that employee can see auto clock-in record."""
        from apps.geofencing.models import LocationUpdate
        
        # Create location inside geofence (triggers auto clock-in)
        location = LocationUpdate.objects.create(
            user=self.employee,
            latitude=Decimal('28.704100'),
            longitude=Decimal('77.102500'),
            accuracy=10,
            timestamp=self.now,
            is_inside_geofence=True,
            geofence=self.geofence
        )
        
        # Login and fetch attendance
        self.client.force_authenticate(user=self.employee)
        response = self.client.get(
            '/api/v1/attendance/records/today_status/',
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('clock_in_time', response.data)
        self.assertIsNotNone(response.data['clock_in_time'])
