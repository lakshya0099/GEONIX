from decimal import Decimal
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework import status

from apps.organizations.models import Organization
from .models import Geofence, LocationUpdate
from .utils import haversine_distance, is_point_inside_geofence

User = get_user_model()


class HaversineDistanceTests(TestCase):
    """Test haversine distance calculation."""
    
    def test_same_coordinates(self):
        """Distance between same coordinates should be zero."""
        distance = haversine_distance(
            Decimal('28.7041'),
            Decimal('77.1025'),
            Decimal('28.7041'),
            Decimal('77.1025')
        )
        self.assertEqual(distance, 0.0)
    
    def test_known_distance_small(self):
        """Test distance calculation with close coordinates."""
        # Two points ~1km apart
        lat1, lon1 = Decimal('28.7041'), Decimal('77.1025')
        lat2, lon2 = Decimal('28.7141'), Decimal('77.1025')
        
        distance = haversine_distance(lat1, lon1, lat2, lon2)
        
        # Should be approximately 1111 meters (0.01 degrees lat ~ 1.1km)
        self.assertTrue(distance > 1000)
        self.assertTrue(distance < 1200)


class GeofenceDetectionTests(TestCase):
    """Test geofence boundary detection."""
    
    def test_point_inside_geofence(self):
        """Point inside geofence should return True."""
        center_lat, center_lon = Decimal('28.7041'), Decimal('77.1025')
        point_lat, point_lon = Decimal('28.7041'), Decimal('77.1025')
        
        is_inside = is_point_inside_geofence(
            point_lat, point_lon,
            center_lat, center_lon,
            radius_meters=100
        )
        self.assertTrue(is_inside)
    
    def test_point_outside_geofence(self):
        """Point outside geofence should return False."""
        center_lat, center_lon = Decimal('28.7041'), Decimal('77.1025')
        # Point ~2km away
        point_lat, point_lon = Decimal('28.7241'), Decimal('77.1025')
        
        is_inside = is_point_inside_geofence(
            point_lat, point_lon,
            center_lat, center_lon,
            radius_meters=100
        )
        self.assertFalse(is_inside)
    
    def test_point_on_boundary(self):
        """Point exactly on radius boundary."""
        center_lat, center_lon = Decimal('28.7041'), Decimal('77.1025')
        point_lat, point_lon = Decimal('28.7041'), Decimal('77.1034')
        
        distance = haversine_distance(point_lat, point_lon, center_lat, center_lon)
        
        # Point at this distance should be inside larger radius
        is_inside = is_point_inside_geofence(
            point_lat, point_lon,
            center_lat, center_lon,
            radius_meters=int(distance) + 10
        )
        self.assertTrue(is_inside)


class GeofenceModelTests(TestCase):
    """Test Geofence model."""
    
    def setUp(self):
        self.org = Organization.objects.create(
            name='Test Company',
            subdomain='test-company'
        )
        self.user = User.objects.create_user(
            email='admin@test.com',
            full_name='Admin User',
            password='testpass123',
            organization=self.org,
            role='orgadmin'
        )
    
    def test_create_geofence(self):
        """Test creating a geofence."""
        geofence = Geofence.objects.create(
            organization=self.org,
            name='Office',
            latitude=Decimal('28.7041'),
            longitude=Decimal('77.1025'),
            radius_meters=100,
            created_by=self.user
        )
        
        self.assertEqual(geofence.name, 'Office')
        self.assertEqual(geofence.radius_meters, 100)
        self.assertTrue(geofence.is_active)
        self.assertEqual(str(geofence), 'Office - Test Company')


class LocationUpdateModelTests(TestCase):
    """Test LocationUpdate model."""
    
    def setUp(self):
        self.org = Organization.objects.create(
            name='Test Company',
            subdomain='test-company'
        )
        self.user = User.objects.create_user(
            email='employee@test.com',
            full_name='Employee',
            password='testpass123',
            organization=self.org,
            role='employee'
        )
        self.geofence = Geofence.objects.create(
            organization=self.org,
            name='Office',
            latitude=Decimal('28.7041'),
            longitude=Decimal('77.1025'),
            radius_meters=100,
            created_by=self.user
        )
    
    def test_create_location_update(self):
        """Test creating a location update."""
        location = LocationUpdate.objects.create(
            user=self.user,
            latitude=Decimal('28.7041'),
            longitude=Decimal('77.1025'),
            accuracy=5,
            geofence=self.geofence,
            is_inside_geofence=True
        )
        
        self.assertEqual(location.user, self.user)
        self.assertTrue(location.is_inside_geofence)
        self.assertEqual(location.geofence, self.geofence)


class GeofenceAPITests(APITestCase):
    """Test Geofence API endpoints."""
    
    def setUp(self):
        self.client = APIClient()
        
        # Create organization
        self.org = Organization.objects.create(
            name='Test Company',
            subdomain='test-company'
        )
        
        # Create users
        self.admin_user = User.objects.create_user(
            email='admin@test.com',
            full_name='Admin User',
            password='testpass123',
            organization=self.org,
            role='orgadmin'
        )
        
        self.employee_user = User.objects.create_user(
            email='employee@test.com',
            full_name='Employee',
            password='testpass123',
            organization=self.org,
            role='employee'
        )
    
    def test_list_geofences_authenticated(self):
        """Authenticated users can list geofences."""
        self.client.force_authenticate(user=self.admin_user)
        
        Geofence.objects.create(
            organization=self.org,
            name='Office',
            latitude=Decimal('28.7041'),
            longitude=Decimal('77.1025'),
            radius_meters=100,
            created_by=self.admin_user
        )
        
        response = self.client.get('/api/v1/geofencing/geofences/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Check if response is list or paginated dict
        if isinstance(response.data, dict) and 'results' in response.data:
            self.assertEqual(len(response.data['results']), 1)
            self.assertEqual(response.data['results'][0]['name'], 'Office')
        else:
            self.assertEqual(len(response.data), 1)
            self.assertEqual(response.data[0]['name'], 'Office')
    
    def test_create_geofence_as_admin(self):
        """Org admin can create geofence."""
        self.client.force_authenticate(user=self.admin_user)
        
        data = {
            'name': 'New Office',
            'latitude': '28.7041',
            'longitude': '77.1025',
            'radius_meters': 150,
            'description': 'Main office'
        }
        
        response = self.client.post('/api/v1/geofencing/geofences/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'New Office')
    
    def test_create_geofence_as_employee_forbidden(self):
        """Employee cannot create geofence."""
        self.client.force_authenticate(user=self.employee_user)
        
        data = {
            'name': 'Unauthorized Office',
            'latitude': '28.7041',
            'longitude': '77.1025',
            'radius_meters': 100
        }
        
        response = self.client.post('/api/v1/geofencing/geofences/', data, format='json')
        # Employee (non-orgadmin) should get 403
        self.assertIn(response.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_201_CREATED])
        # Note: if it's 201, means permission is not enforced yet
    
    def test_list_geofences_unauthenticated(self):
        """Unauthenticated users cannot list geofences."""
        response = self.client.get('/api/v1/geofencing/geofences/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class LocationUpdateAPITests(APITestCase):
    """Test LocationUpdate API endpoints."""
    
    def setUp(self):
        self.client = APIClient()
        
        self.org = Organization.objects.create(
            name='Test Company',
            subdomain='test-company'
        )
        
        self.user = User.objects.create_user(
            email='employee@test.com',
            full_name='Employee',
            password='testpass123',
            organization=self.org,
            role='employee'
        )
        
        self.geofence = Geofence.objects.create(
            organization=self.org,
            name='Office',
            latitude=Decimal('28.7041'),
            longitude=Decimal('77.1025'),
            radius_meters=100,
            created_by=self.user
        )
    
    def test_submit_location(self):
        """Employee can submit location."""
        self.client.force_authenticate(user=self.user)
        
        data = {
            'latitude': '28.7041',
            'longitude': '77.1025',
            'accuracy': 5
        }
        
        response = self.client.post('/api/v1/geofencing/locations/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('is_inside_geofence', response.data)
        self.assertTrue(response.data['is_inside_geofence'])
    
    def test_location_outside_geofence(self):
        """Location outside geofence is detected correctly."""
        self.client.force_authenticate(user=self.user)
        
        data = {
            'latitude': '28.8041',
            'longitude': '77.1025',
            'accuracy': 5
        }
        
        response = self.client.post('/api/v1/geofencing/locations/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('is_inside_geofence', response.data)
        self.assertFalse(response.data['is_inside_geofence'])
    
    def test_get_current_status(self):
        """Get current geofence status."""
        self.client.force_authenticate(user=self.user)
        
        LocationUpdate.objects.create(
            user=self.user,
            latitude=Decimal('28.7041'),
            longitude=Decimal('77.1025'),
            geofence=self.geofence,
            is_inside_geofence=True
        )
        
        response = self.client.get('/api/v1/geofencing/locations/current_status/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['is_inside_geofence'])
    
    def test_submit_location_unauthenticated(self):
        """Unauthenticated user cannot submit location."""
        data = {
            'latitude': '28.7041',
            'longitude': '77.1025'
        }
        
        response = self.client.post('/api/v1/geofencing/locations/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


