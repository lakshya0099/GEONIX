from rest_framework.permissions import BasePermission


class IsOrgAdmin(BasePermission):
    """Allow only organization admins (orgadmin role)."""
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'orgadmin'


class IsOrgAdminOrReadOnly(BasePermission):
    """Allow org admins to edit, others to read."""
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        # Allow read permissions
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return request.user.organization == obj.organization
        
        # Allow write permissions only for org admins
        return request.user.role == 'orgadmin' and request.user.organization == obj.organization


class IsEmployeeInSameOrg(BasePermission):
    """Allow employees to submit locations only for their own organization."""
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.organization is not None
