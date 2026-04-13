from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from datetime import datetime, timedelta
from django.db.models import Q, Sum, Count, F
from decimal import Decimal

from .models import AttendanceRecord, AttendanceSettings, CheckInEvent
from .serializers import (
    AttendanceRecordSerializer,
    AttendanceRecordListSerializer,
    AttendanceRecordCheckInSerializer,
    AttendanceRecordCheckOutSerializer,
    AttendanceSettingsSerializer,
    CheckInEventSerializer,
)
from .permissions import IsAuthenticatedInOrg, IsOrgAdminOrSelf, IsOrgAdmin


@api_view(['GET', 'PATCH'])
@permission_classes([IsOrgAdmin])
def attendance_settings_patch(request):
    """Handle GET and PATCH for attendance settings without requiring an ID."""
    user = request.user
    
    # Get or create settings
    settings, created = AttendanceSettings.objects.get_or_create(
        organization=user.organization
    )
    
    if request.method == 'GET':
        serializer = AttendanceSettingsSerializer(settings)
        return Response(serializer.data)
    
    elif request.method == 'PATCH':
        serializer = AttendanceSettingsSerializer(settings, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)


class AttendanceSettingsViewSet(viewsets.ModelViewSet):
    """ViewSet for managing attendance settings."""
    serializer_class = AttendanceSettingsSerializer
    permission_classes = [IsOrgAdmin]
    
    def get_queryset(self):
        """Return settings for user's organization."""
        user = self.request.user
        if not user.organization:
            return AttendanceSettings.objects.none()
        return AttendanceSettings.objects.filter(organization=user.organization)
    
    def get_object(self):
        """Get or create the single settings object for this organization."""
        user = self.request.user
        settings, created = AttendanceSettings.objects.get_or_create(
            organization=user.organization
        )
        return settings
    
    def list(self, request, *args, **kwargs):
        """Override list - GET /api/v1/attendance/settings/ returns org's settings"""
        settings = self.get_object()
        serializer = self.get_serializer(settings)
        return Response(serializer.data)
    
    def create(self, request, *args, **kwargs):
        """Override create - POST /api/v1/attendance/settings/ updates settings"""
        settings = self.get_object()
        serializer = self.get_serializer(settings, data=request.data, partial=False)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def partial_update(self, request, *args, **kwargs):
        """Handle PATCH without requiring an ID"""
        settings = self.get_object()
        serializer = self.get_serializer(settings, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
    
    def update(self, request, *args, **kwargs):
        """Handle PUT by treating as partial update"""
        return self.partial_update(request, *args, **kwargs)
    
    def perform_create(self, serializer):
        """Set organization from user."""
        serializer.save(organization=self.request.user.organization)


class AttendanceRecordViewSet(viewsets.ModelViewSet):
    """ViewSet for managing attendance records."""
    permission_classes = [IsAuthenticated, IsOrgAdminOrSelf]
    
    def get_serializer_class(self):
        """Use different serializers for list vs detail."""
        if self.action == 'list':
            return AttendanceRecordListSerializer
        elif self.action == 'check_in':
            return AttendanceRecordCheckInSerializer
        elif self.action == 'check_out':
            return AttendanceRecordCheckOutSerializer
        return AttendanceRecordSerializer
    
    def get_queryset(self):
        """Return records for user's organization."""
        user = self.request.user
        if not user.organization:
            return AttendanceRecord.objects.none()
        
        # Org admins see all records in their org
        if user.role == 'orgadmin':
            return AttendanceRecord.objects.filter(
                organization=user.organization
            ).select_related('user', 'organization')
        
        # Employees see only their own records
        return AttendanceRecord.objects.filter(
            user=user,
            organization=user.organization
        ).select_related('user', 'organization')
    
    @action(detail=False, methods=['get'], permission_classes=[IsOrgAdmin])
    def summary(self, request):
        """Per-employee attendance summary for date range."""
        from django.contrib.auth import get_user_model
        import datetime
    
        User = get_user_model()
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        today = datetime.date.today()
    
        users = User.objects.filter(
            organization=request.user.organization,
            is_active=True
        )
    
        result = []
        for user in users:
            qs = AttendanceRecord.objects.filter(
                user=user,
                organization=request.user.organization
            )
            if date_from:
                qs = qs.filter(date__gte=date_from)
            if date_to:
                qs = qs.filter(date__lte=date_to)
    
            today_record = AttendanceRecord.objects.filter(
                user=user, date=today
            ).first()
    
            # total_hours CharField hai toh Sum ki jagah yeh
            total = sum(
                float(r.total_hours or 0)
                for r in qs
                if r.total_hours
            )
    
            last_record = qs.filter(
                clock_in_time__isnull=False
            ).order_by('-date').first()
    
            result.append({
                'employee_id': user.id,
                'full_name': user.full_name,
                'email': user.email,
                'present_days': qs.filter(is_present=True).count(),
                'absent_days': qs.filter(is_present=False).count(),
                'late_days': qs.filter(is_late=True).count(),
                'total_hours': round(total, 2),
                'last_seen': str(last_record.date) if last_record else None,
                'is_present_today': today_record.is_present if today_record else False,
                'today_clock_in': str(today_record.clock_in_time) if today_record else None,
                'today_clock_out': str(today_record.clock_out_time) if today_record else None,
            })
    
        return Response(result)
    
    @action(detail=False, methods=['post'])
    def check_in(self, request):
        """Manual check-in for employee."""
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        record = serializer.create(serializer.validated_data)
        
        response_serializer = AttendanceRecordSerializer(record, context={'request': request})
        return Response(response_serializer.data, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['post'])
    def check_out(self, request):
        """Manual check-out for employee."""
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        record = serializer.create(serializer.validated_data)
        
        response_serializer = AttendanceRecordSerializer(record, context={'request': request})
        return Response(response_serializer.data, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['get'])
    def today_status(self, request):
        """Get today's attendance status for current user."""
        user = request.user
        today = datetime.now().date()
        
        try:
            record = AttendanceRecord.objects.get(user=user, date=today)
            serializer = AttendanceRecordSerializer(record, context={'request': request})
            return Response(serializer.data, status=status.HTTP_200_OK)
        except AttendanceRecord.DoesNotExist:
            return Response(
                {'detail': 'No attendance record for today'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['get'])
    def my_records(self, request):
        """Get current user's recent attendance records (last 30 days)."""
        user = request.user
        thirty_days_ago = (datetime.now() - timedelta(days=30)).date()
        
        records = AttendanceRecord.objects.filter(
            user=user,
            date__gte=thirty_days_ago
        ).order_by('-date')
        
        serializer = AttendanceRecordListSerializer(records, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[IsOrgAdmin])
    def daily_summary(self, request):
        """Get daily attendance summary for organization."""
        user = self.request.user
        date_str = request.query_params.get('date')
        
        if not date_str:
            target_date = datetime.now().date()
        else:
            try:
                target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            except ValueError:
                return Response(
                    {'detail': 'Invalid date format. Use YYYY-MM-DD'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        records = AttendanceRecord.objects.filter(
            organization=user.organization,
            date=target_date
        ).select_related('user')
        
        total = records.count()
        present = records.filter(is_present=True).count()
        absent = records.filter(is_present=False).count()
        late = records.filter(is_late=True).count()
        
        data = {
            'date': target_date,
            'total_employees': total,
            'present': present,
            'absent': absent,
            'late': late,
            'records': AttendanceRecordListSerializer(records, many=True).data
        }
        
        return Response(data)
    
    @action(detail=False, methods=['get'], permission_classes=[IsOrgAdmin])
    def weekly_summary(self, request):
        """Get weekly attendance summary."""
        user = self.request.user
        days_back = int(request.query_params.get('days', 7))
        
        start_date = (datetime.now() - timedelta(days=days_back)).date()
        end_date = datetime.now().date()
        
        records = AttendanceRecord.objects.filter(
            organization=user.organization,
            date__gte=start_date,
            date__lte=end_date
        )
        
        # Group by date
        daily_stats = []
        current_date = start_date
        while current_date <= end_date:
            daily = records.filter(date=current_date)
            if daily.exists():
                daily_stats.append({
                    'date': current_date,
                    'total': daily.count(),
                    'present': daily.filter(is_present=True).count(),
                    'absent': daily.filter(is_present=False).count(),
                    'late': daily.filter(is_late=True).count(),
                })
            current_date += timedelta(days=1)
        
        return Response({
            'period': f'{start_date}_{end_date}',
            'daily_breakdown': daily_stats,
        })
    
    @action(detail=False, methods=['get'], permission_classes=[IsOrgAdmin])
    def monthly_summary(self, request):
        """Get monthly attendance summary."""
        user = self.request.user
        month = int(request.query_params.get('month', datetime.now().month))
        year = int(request.query_params.get('year', datetime.now().year))
        
        records = AttendanceRecord.objects.filter(
            organization=user.organization,
            date__year=year,
            date__month=month
        ).select_related('user')
        
        # Aggregate by employee
        employee_stats = {}
        for record in records:
            email = record.user.email
            if email not in employee_stats:
                employee_stats[email] = {
                    'user_name': record.user.full_name,
                    'total_days': 0,
                    'present_days': 0,
                    'absent_days': 0,
                    'late_days': 0,
                    'total_hours': str(Decimal('0')),
                }
            
            stats = employee_stats[email]
            stats['total_days'] += 1
            if record.is_present:
                stats['present_days'] += 1
            else:
                stats['absent_days'] += 1
            if record.is_late:
                stats['late_days'] += 1
            if record.total_hours:
                stats['total_hours'] = str(Decimal(stats['total_hours']) + record.total_hours)
        
        return Response({
            'month': month,
            'year': year,
            'employee_summary': employee_stats,
        })


class CheckInEventViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing check-in events (read-only)."""
    serializer_class = CheckInEventSerializer
    permission_classes = [IsAuthenticated, IsOrgAdminOrSelf]
    
    def get_queryset(self):
        """Return events for user's organization."""
        user = self.request.user
        if not user.organization:
            return CheckInEvent.objects.none()
        
        # Org admins see all events in their org
        if user.role == 'orgadmin':
            return CheckInEvent.objects.filter(
                user__organization=user.organization
            ).select_related('user', 'geofence')
        
        # Employees see only their own events
        return CheckInEvent.objects.filter(
            user=user
        ).select_related('user', 'geofence')

