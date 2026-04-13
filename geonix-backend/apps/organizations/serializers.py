from rest_framework import serializers
from .models import Organization
from .models import EmployeeInvite
from apps.accounts.models import User
from django.utils import timezone
from datetime import timedelta


class CompanySignupSerializer(serializers.Serializer):
    organization_name = serializers.CharField()
    subdomain = serializers.CharField()

    admin_email = serializers.EmailField()
    admin_name = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def create(self, validated_data):
        org_name = validated_data["organization_name"]
        subdomain = validated_data["subdomain"]

        admin_email = validated_data["admin_email"]
        admin_name = validated_data["admin_name"]
        password = validated_data["password"]

        # Create organization
        organization = Organization.objects.create(
            name=org_name,
            subdomain=subdomain
        )

        # Create admin user
        user = User.objects.create(
            email=admin_email,
            full_name=admin_name,
            role="orgadmin",
            organization=organization
        )

        user.set_password(password)
        user.save()

        return user
    
class CreateInviteSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def create(self, validated_data):
        user = self.context["request"].user

        invite = EmployeeInvite.objects.create(
            email=validated_data["email"],
            organization=user.organization,
            expires_at=timezone.now() + timedelta(days=7)
        )

        return invite