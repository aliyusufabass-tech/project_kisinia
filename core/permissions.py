from rest_framework.permissions import BasePermission


class IsRestaurantOwner(BasePermission):
    """Permission check for restaurant owners"""
    def has_permission(self, request, view):
        try:
            return request.user.profile.role == 'RESTAURANT_OWNER'
        except:
            return False


class IsAdminUser(BasePermission):
    """Permission check for admin users"""
    def has_permission(self, request, view):
        return request.user.is_staff
