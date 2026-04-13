# Geofencing Module Documentation

## Overview

The Geofencing module enables organizations to create and manage geographic boundaries (geofences) and track employee locations in real-time. It automatically detects when employees enter or exit defined areas and provides APIs for location management.

## Features

### ✅ Implemented
- **Geofence Management**: Create, read, update, and delete geographic zones
- **Location Tracking**: Submit GPS coordinates from mobile devices
- **Automatic Detection**: System automatically detects if location is inside/outside geofences
- **Permission-based Access**: Role-based permissions (orgadmin creates, employee submits)
- **Location History**: Track location updates over time with timestamps
- **Multi-geofence Support**: Organizations can define multiple geofences

## Data Models

### Geofence Model
Represents a circular geographic boundary.

**Fields:**
- `id` (UUID): Unique identifier
- `organization` (ForeignKey): Organization that owns this geofence
- `name` (String): Human-readable name (e.g., "Main Office")
- `description` (Text, optional): Additional details
- `latitude` (Decimal): Center point latitude (WGS84)
- `longitude` (Decimal): Center point longitude (WGS84)
- `radius_meters` (Integer): Boundary radius in meters (minimum 10m)
- `created_by` (ForeignKey): User who created the geofence
- `is_active` (Boolean): Whether geofence is enabled
- `created_at` (DateTime): Creation timestamp
- `updated_at` (DateTime): Last update timestamp

### LocationUpdate Model
Represents an employee's location snapshot.

**Fields:**
- `id` (UUID): Unique identifier
- `user` (ForeignKey): Employee who submitted the location
- `latitude` (Decimal): Location latitude (WGS84)
- `longitude` (Decimal): Location longitude (WGS84)
- `accuracy` (Integer, optional): GPS accuracy in meters
- `geofence` (ForeignKey, nullable): Which geofence they're in (if any)
- `is_inside_geofence` (Boolean): Whether inside any active geofence
- `timestamp` (DateTime): When location was submitted

## API Endpoints

### Geofence Management

#### List Geofences
```
GET /api/v1/geofencing/geofences/
```
Returns paginated list of geofences for user's organization.

**Permissions:** Authenticated users

**Response:**
```json
{
  "count": 10,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Main Office",
      "description": "HQ",
      "latitude": "28.7041",
      "longitude": "77.1025",
      "radius_meters": 100,
      "organization": "550e8400-e29b-41d4-a716-446655440001",
      "organization_name": "Acme Corp",
      "is_active": true,
      "created_by": "550e8400-e29b-41d4-a716-446655440002",
      "created_by_email": "admin@acme.com",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### Create Geofence
```
POST /api/v1/geofencing/geofences/
```
Create a new geofence. Only organization admins can do this.

**Permissions:** Authenticated, Organization Admin only

**Request Body:**
```json
{
  "name": "New Office",
  "description": "Secondary office",
  "latitude": "28.6100",
  "longitude": "77.2300",
  "radius_meters": 150
}
```

**Response:** 201 Created with geofence object

#### Get Geofence Details
```
GET /api/v1/geofencing/geofences/{id}/
```

**Permissions:** Authenticated users in same organization

#### Update Geofence
```
PUT /api/v1/geofencing/geofences/{id}/
PATCH /api/v1/geofencing/geofences/{id}/
```
Full or partial update. Only org admins.

**Permissions:** Organization Admin only

#### Delete Geofence
```
DELETE /api/v1/geofencing/geofences/{id}/
```

**Permissions:** Organization Admin only

### Location Management

#### Submit Current Location
```
POST /api/v1/geofencing/locations/
```
Submit employee's current GPS location. System automatically detects geofence.

**Permissions:** Authenticated users in organization

**Request Body:**
```json
{
  "latitude": "28.7041",
  "longitude": "77.1025",
  "accuracy": 5
}
```

**Response:** 201 Created with location object
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440003",
  "latitude": "28.7041",
  "longitude": "77.1025",
  "accuracy": 5,
  "is_inside_geofence": true,
  "geofence": "550e8400-e29b-41d4-a716-446655440000",
  "geofence_name": "Main Office",
  "user": "550e8400-e29b-41d4-a716-446655440004",
  "user_email": "employee@acme.com",
  "timestamp": "2024-01-15T14:22:30Z"
}
```

#### Get Location History
```
GET /api/v1/geofencing/locations/
```
Get location history. Employees see their own, org admins see all in organization.

**Permissions:** Authenticated users

**Response:** Paginated list of location updates

#### Get My Locations
```
GET /api/v1/geofencing/locations/my_locations/
```
Get current user's location history (last 50).

**Permissions:** Authenticated users

**Response:** List of location updates (not paginated)

#### Get Current Status
```
GET /api/v1/geofencing/locations/current_status/
```
Get user's latest location and geofence status.

**Permissions:** Authenticated users

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440003",
  "latitude": "28.7041",
  "longitude": "77.1025",
  "accuracy": 5,
  "is_inside_geofence": true,
  "geofence": "550e8400-e29b-41d4-a716-446655440000",
  "geofence_name": "Main Office",
  "user": "550e8400-e29b-41d4-a716-446655440004",
  "user_email": "employee@acme.com",
  "timestamp": "2024-01-15T14:22:30Z"
}
```

## Permission Model

### Role-Based Access
- **Superadmin**: Full access (not yet implemented)
- **Organization Admin** (`orgadmin`): 
  - Create, update, delete geofences
  - View all locations in their organization
  - View geofences for their organization
- **Employee** (`employee`):
  - View geofences for their organization
  - Submit their own location
  - View their own location history

### Table: Permission Matrix
| Action | Superadmin | OrgAdmin | Employee |
|--------|-----------|----------|----------|
| Create Geofence | ✓ | ✓ | ✗ |
| Update Geofence | ✓ | ✓ | ✗ |
| Delete Geofence | ✓ | ✓ | ✗ |
| List Geofences | ✓ | ✓ | ✓ |
| Submit Location | ✓ | ✓ | ✓ |
| View Own Locations | ✓ | ✓ | ✓ |
| View All Org Locations | ✓ | ✓ | ✗ |

## Technical Details

### Distance Calculation

Uses the **Haversine formula** for accurate great-circle distance calculation between two GPS coordinates.

```python
from apps.geofencing.utils import haversine_distance
from decimal import Decimal

distance_meters = haversine_distance(
    lat1=Decimal('28.7041'),
    lon1=Decimal('77.1025'),
    lat2=Decimal('28.7050'),
    lon2=Decimal('77.1030')
)
# Returns distance in meters
```

### Geofence Detection

```python
from apps.geofencing.utils import is_point_inside_geofence
from decimal import Decimal

is_inside = is_point_inside_geofence(
    point_lat=Decimal('28.7041'),
    point_lon=Decimal('77.1025'),
    geofence_lat=Decimal('28.7041'),
    geofence_lon=Decimal('77.1025'),
    radius_meters=100
)
# Returns True if point is within radius, False otherwise
```

### Coordinate System
- **WGS84** (World Geodetic System 1984)
- Decimal degrees with 6 decimal places precision (approx. 11cm accuracy)
- Example: `28.704100, 77.102500`

### Location Submission Flow
1. Mobile app sends GET request with latitude, longitude, accuracy
2. Server receives location via `POST /api/v1/geofencing/locations/`
3. System queries all active geofences for user's organization
4. For each geofence, calculates distance using Haversine formula
5. If distance <= radius, marks as inside that geofence
6. Stores location update with geofence assignment
7. Returns response with geofence status

## Testing

All functionality is fully tested with 15 unit and integration tests:

**Test Categories:**
- Distance calculation accuracy
- Geofence boundary detection
- Model creation and relationships
- API endpoint access and permissions
- Location submission and detection
- Error handling

**Run Tests:**
```bash
python manage.py test apps.geofencing
```

**Test Results:** ✅ 15/15 passing

## Code Structure

```
apps/geofencing/
├── models.py           # Geofence and LocationUpdate models
├── serializers.py      # DRF serializers for API responses
├── views.py            # ViewSets for API endpoints
├── permissions.py      # Permission classes for access control
├── utils.py            # Haversine distance and detection logic
├── urls.py             # URL routing
├── tests.py            # Comprehensive test suite
├── admin.py            # Django admin registration
├── apps.py             # App configuration
├── migrations/         # Database migrations
│   └── 0001_initial.py
└── __init__.py
```

## Admin Panel

Geofences and Location Updates are registered in Django admin for easy management:
- Browse and search geofences
- View location history
- Edit geofence details
- Filter by organization, date, status

Access at: `/admin/geofencing/`

## Security Considerations

1. **User Authentication Required**: All endpoints require JWT authentication
2. **Organization Isolation**: Users only see data for their organization
3. **Role-based Permissions**: Admin operations restricted to org admins
4. **Location Accuracy**: GPS accuracy field for quality assessment
5. **Timestamp Tracking**: All locations timestamped server-side
6. **Read-only Fields**: Critical fields (computed fields) are read-only

## Performance Optimization

- **Database Indexes**: `(user, -timestamp)` and `(geofence, -timestamp)` for fast queries
- **Select Related**: Prefetch organization and user data
- **Geofence Caching**: Only query active geofences (optional future enhancement)
- **Limited History**: Default 50 locations in history endpoint

## Future Enhancements

1. **Geofence Events**: Trigger webhooks on entry/exit events
2. **Attendance Automation**: Auto clock-in/out based on geofence
3. **Geofence Scheduling**: Time-based geofence activation
4. **Heat Maps**: Visualize employee locations over time
5. **Alerts**: Notify when employee outside expected geofence
6. **Rate Limiting**: Prevent location spam from mobile apps
7. **Geofence Shapes**: Support polygons beyond circles
8. **Offline Mode**: Queue locations when offline, sync later

## Common Issues & Troubleshooting

### Issue: "Invalid HTTP_HOST header: 'testserver'"
**Solution**: Add 'testserver' to ALLOWED_HOSTS in settings.py for testing

### Issue: Location not being detected in geofence
**Possible Causes:**
- Geofence is inactive (`is_active=False`)
- GPS coordinates are too far from geofence center
- Accuracy values might be affecting detection

### Issue: API returns 403 Forbidden on create
**Solution**: User must be organization admin (`role='orgadmin'`)

## Related Modules

- **Accounts**: User authentication and role management
- **Organizations**: Organization and team management
- **Attendance** (future): Clock in/out based on geofence events

## Contact & Support

For issues or questions, refer to project documentation or contact the development team.
