#!/usr/bin/env python
"""
Demo Setup Script for GEONIX
Creates demo organization, employees, and attendance settings

Usage: python create_demo_setup.py (recommended)
Or: python manage.py shell < create_demo_setup.py
Or (PowerShell): Get-Content create_demo_setup.py | python manage.py shell
"""

import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.organizations.models import Organization
from apps.attendance.models import AttendanceSettings

User = get_user_model()

print("\n" + "="*60)
print("GEONIX DEMO SETUP")
print("="*60)

# Step 1: Create Organization
print("\n[1] Creating demo organization...")
org, org_created = Organization.objects.get_or_create(
    name='Tech Startup Inc',
    defaults={'subdomain': 'techstartup'}
)

if org_created:
    print(f"   ✓ Organization created: {org.name}")
else:
    print(f"   ✓ Organization already exists: {org.name}")

# Step 2: Create Org Admin
print("\n[2] Creating organization admin...")
admin_user, admin_created = User.objects.get_or_create(
    email='admin@techstartup.com',
    defaults={
        'full_name': 'John Admin',
        'role': 'orgadmin',
        'organization': org,
        'is_active': True
    }
)

if admin_created:
    admin_user.set_password('admin123')
    admin_user.save()
    print(f"   ✓ Admin created: {admin_user.email}")
    print(f"   Password: admin123")
else:
    print(f"   ✓ Admin already exists: {admin_user.email}")

# Step 3: Create Demo Employees
print("\n[3] Creating demo employees...")
demo_employees = [
    {
        'email': 'alice@techstartup.com',
        'full_name': 'Alice Johnson',
        'password': 'alice123'
    },
    {
        'email': 'bob@techstartup.com',
        'full_name': 'Bob Smith',
        'password': 'bob123'
    },
    {
        'email': 'charlie@techstartup.com',
        'full_name': 'Charlie Brown',
        'password': 'charlie123'
    },
    {
        'email': 'diana@techstartup.com',
        'full_name': 'Diana Prince',
        'password': 'diana123'
    },
]

for emp_data in demo_employees:
    emp_user, emp_created = User.objects.get_or_create(
        email=emp_data['email'],
        defaults={
            'full_name': emp_data['full_name'],
            'role': 'employee',
            'organization': org,
            'is_active': True
        }
    )
    
    if emp_created:
        emp_user.set_password(emp_data['password'])
        emp_user.save()
        print(f"   ✓ Employee created: {emp_user.email}")
        print(f"     └─ Password: {emp_data['password']}")
    else:
        print(f"   ✓ Employee already exists: {emp_user.email}")

# Step 4: Create Attendance Settings
print("\n[4] Setting up attendance configuration...")
settings, settings_created = AttendanceSettings.objects.get_or_create(
    organization=org,
    defaults={
        'working_hours_start': '09:00:00',
        'working_hours_end': '18:00:00',
        'late_threshold_minutes': 30,
        'auto_checkout_enabled': False,
        'auto_checkout_minutes': 5
    }
)

if settings_created:
    print(f"   ✓ Attendance settings created")
    print(f"     └─ Working hours: 9:00 AM - 6:00 PM")
    print(f"     └─ Late threshold: 30 minutes")
else:
    print(f"   ✓ Attendance settings already exist")

# Step 5: Summary
print("\n" + "="*60)
print("SETUP COMPLETE!")
print("="*60)

print("\n📋 LOGIN CREDENTIALS:\n")
print("ADMIN:")
print(f"  Email: {admin_user.email}")
print(f"  Password: admin123")
print(f"  URL: http://localhost:5173/login")

print("\nEMPLOYEES:")
for emp_data in demo_employees:
    print(f"  Email: {emp_data['email']}")
    print(f"  Password: {emp_data['password']}")

print("\n" + "="*60)
print("Next Steps:")
print("1. Start frontend: npm run dev")
print("2. Go to: http://localhost:5173/login")
print("3. Login as admin to manage organization")
print("4. Login as employee to check in/out")
print("="*60 + "\n")
