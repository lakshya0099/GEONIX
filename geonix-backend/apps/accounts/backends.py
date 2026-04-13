from django.contrib.auth.backends import ModelBackend
from .models import User


class EmailBackend(ModelBackend):
    """
    Custom authentication backend that uses email instead of username
    """
    def authenticate(self, request, username=None, password=None, email=None, **kwargs):
        try:
            # Try to get user by email
            if email:
                user = User.objects.get(email=email)
            elif username:
                # Fallback to username (for admin panel)
                user = User.objects.get(email=username)
            else:
                return None

            # Check password
            if user.check_password(password) and self.user_can_authenticate(user):
                return user
        except User.DoesNotExist:
            return None

    def get_user(self, user_id):
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None
