from rest_framework.permissions import BasePermission


class IsAuthenticatedInOrg(BasePermission):
    """Allow only authenticated users who belong to an organization."""
    
    def has_permission(self, request, view):
        return (request.user and 
                request.user.is_authenticated and 
                request.user.organization is not None)


class IsOrgAdminOrSelf(BasePermission):
    """Allow org admins to access all records, employees their own."""
    
    def has_permission(self, request, view):
        return (request.user and 
                request.user.is_authenticated and 
                request.user.organization is not None)
    
    def has_object_permission(self, request, view, obj):
        user = request.user
        
        # Org admins can access all records in their org
        if user.role == 'orgadmin':
            return obj.organization == user.organization
        
        # Employees can only access their own records
        if hasattr(obj, 'user'):
            return obj.user == user and obj.organization == user.organization
        
        return False


class IsOrgAdmin(BasePermission):
    """Allow only organization admins."""
    
    def has_permission(self, request, view):
        return (request.user and 
                request.user.is_authenticated and 
                request.user.role == 'orgadmin')
