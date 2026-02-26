from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import UserViewSet, UserProfileViewSet, RestaurantViewSet, VisioniaViewSet, BookingViewSet, register

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'profiles', UserProfileViewSet, basename='profile')
router.register(r'restaurants', RestaurantViewSet, basename='restaurant')
router.register(r'visiinias', VisioniaViewSet, basename='visinia')
router.register(r'bookings', BookingViewSet, basename='booking')

urlpatterns = [
    path('register/', register, name='register'),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('', include(router.urls)),
]
