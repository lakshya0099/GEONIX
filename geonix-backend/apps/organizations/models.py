from django.db import models
import uuid
from django.db import models


class Organization(models.Model):
    name = models.CharField(max_length=255)
    subdomain = models.SlugField(unique=True)

    subscription_plan = models.CharField(
        max_length=50,
        default="basic"
    )

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name
    
class EmployeeInvite(models.Model):
    email = models.EmailField()

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="invites"
    )

    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)

    is_used = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    def __str__(self):
        return f"{self.email} invite"