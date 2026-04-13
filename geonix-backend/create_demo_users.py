#!/usr/bin/env python
"""
Quick script to create demo users for testing
Run from terminal: python create_demo_users.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.accounts.models import User
from apps.organizations.models import Organization

# Create or get organization
org, created = Organization.objects.get_or_create(
    subdomain='demo-org',
    defaults={
        'name': 'Demo Organization',
        'subscription_plan': 'basic'
    }
)
print(f"✓ Organization: {org.name} ({'created' if created else 'exists'})")

# Create admin user
admin_user, admin_created = User.objects.get_or_create(
    email='admin@test.com',
    defaults={
        'full_name': 'Admin User',
        'role': 'orgadmin',
        'organization': org,
        'is_active': True,
        'is_staff': True,
    }
)
if admin_created:
    admin_user.set_password('testpass123')
    admin_user.save()
    print(f"✓ Created admin user: {admin_user.email}")
else:
    print(f"✓ Admin user exists: {admin_user.email}")

# Create employee user
employee_user, emp_created = User.objects.get_or_create(
    email='emp@test.com',
    defaults={
        'full_name': 'Employee User',
        'role': 'employee',
        'organization': org,
        'is_active': True,
    }
)
if emp_created:
    employee_user.set_password('testpass123')
    employee_user.save()
    print(f"✓ Created employee user: {employee_user.email}")
else:
    print(f"✓ Employee user exists: {employee_user.email}")

print("\n✅ Demo users ready!")
print("   Admin: admin@test.com / testpass123")
print("   Employee: emp@test.com / testpass123")
