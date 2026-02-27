from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth.models import User
from django.db import transaction
from django.http import FileResponse, Http404

from .models import UserProfile, Restaurant, Visinia, Booking, BookingItem
from .serializers import (
    UserSerializer, UserProfileSerializer, RestaurantSerializer,
    VisioniaSerializer, BookingSerializer, BookingCreateSerializer, BookingItemSerializer,
    RegistrationSerializer, AdminOwnerRegistrationSerializer
)
from .permissions import IsRestaurantOwner, IsAdminUser


class UserViewSet(viewsets.ReadOnlyModelViewSet):
    """User viewset for listing and retrieving users"""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def me(self, request):
        """Get current user info"""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=True, methods=['delete'], permission_classes=[IsAuthenticated])
    def admin_delete(self, request, pk=None):
        """Allow staff/admin panel to delete non-superuser accounts."""
        if not request.user.is_staff:
            return Response(
                {"detail": "Only staff users can delete accounts."},
                status=status.HTTP_403_FORBIDDEN
            )

        target_user = self.get_object()

        if target_user == request.user:
            return Response(
                {"detail": "You cannot delete your own account."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if target_user.is_superuser:
            return Response(
                {"detail": "Superuser accounts cannot be deleted from this panel."},
                status=status.HTTP_403_FORBIDDEN
            )

        target_user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class UserProfileViewSet(viewsets.ModelViewSet):
    """User profile viewset"""
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Users can only see their own profile and admins can see all
        if self.request.user.is_staff:
            return UserProfile.objects.all()
        return UserProfile.objects.filter(user=self.request.user)


class RestaurantViewSet(viewsets.ModelViewSet):
    """Restaurant viewset for CRUD operations"""
    queryset = Restaurant.objects.all()
    serializer_class = RestaurantSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Restaurant owners see their restaurants, customers see all active ones
        # Ensure a UserProfile exists to avoid RelatedObjectDoesNotExist
        user_profile, _ = UserProfile.objects.get_or_create(user=self.request.user)
        if user_profile.role == 'RESTAURANT_OWNER':
            return Restaurant.objects.filter(owner=self.request.user)
        return Restaurant.objects.filter(is_active=True)

    def perform_create(self, serializer):
        """Set the owner to current user"""
        serializer.save(owner=self.request.user)

    def perform_update(self, serializer):
        """Only allow owner to update"""
        restaurant = self.get_object()
        if restaurant.owner != self.request.user and not self.request.user.is_staff:
            return Response(
                {"detail": "You can only edit your own restaurants."},
                status=status.HTTP_403_FORBIDDEN
            )
        serializer.save()

    @action(detail=False, methods=['get'])
    def my_restaurants(self, request):
        """Get current user's restaurants"""
        restaurants = Restaurant.objects.filter(owner=request.user)
        serializer = self.get_serializer(restaurants, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], permission_classes=[AllowAny])
    def logo_file(self, request, pk=None):
        """Serve restaurant logo directly through API."""
        restaurant = self.get_object()
        if not restaurant.logo:
            raise Http404("Logo not found")
        return FileResponse(restaurant.logo.open('rb'), content_type='image/*')


class VisioniaViewSet(viewsets.ModelViewSet):
    """Visinia viewset for managing food items"""
    queryset = Visinia.objects.all()
    serializer_class = VisioniaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Restaurant owners see their visiinias, customers see available ones
        # Ensure a UserProfile exists to avoid RelatedObjectDoesNotExist
        user_profile, _ = UserProfile.objects.get_or_create(user=self.request.user)
        if user_profile.role == 'RESTAURANT_OWNER':
            return Visinia.objects.filter(restaurant__owner=self.request.user)
        return Visinia.objects.filter(is_available=True)

    def perform_create(self, serializer):
        """Validate restaurant ownership"""
        restaurant_id = self.request.data.get('restaurant')
        restaurant = Restaurant.objects.get(id=restaurant_id)

        if restaurant.owner != self.request.user and not self.request.user.is_staff:
            return Response(
                {"detail": "You can only add visiinias to your restaurants."},
                status=status.HTTP_403_FORBIDDEN
            )
        serializer.save()

    @action(detail=False, methods=['get'])
    def by_restaurant(self, request):
        """Get visiinias by restaurant ID"""
        restaurant_id = request.query_params.get('restaurant_id')
        if not restaurant_id:
            return Response(
                {"detail": "restaurant_id parameter is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        visiinias = Visinia.objects.filter(restaurant_id=restaurant_id, is_available=True)
        serializer = self.get_serializer(visiinias, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], permission_classes=[AllowAny])
    def image_file(self, request, pk=None):
        """Serve visinia image directly through API."""
        visinia = self.get_object()
        if not visinia.image:
            raise Http404("Image not found")
        return FileResponse(visinia.image.open('rb'), content_type='image/*')


class BookingViewSet(viewsets.ModelViewSet):
    """Booking viewset for managing orders"""
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Ensure a UserProfile exists to avoid RelatedObjectDoesNotExist
        user_profile, _ = UserProfile.objects.get_or_create(user=self.request.user)
        if user_profile.role == 'ADMIN':
            return Booking.objects.all()
        elif user_profile.role == 'RESTAURANT_OWNER':
            return Booking.objects.filter(restaurant__owner=self.request.user)
        else:  # CUSTOMER
            return Booking.objects.filter(customer=self.request.user)

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        """Create a new booking"""
        serializer = BookingCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        restaurant_id = serializer.validated_data['restaurant_id']
        items_data = serializer.validated_data['items']
        notes = serializer.validated_data.get('notes', '')

        try:
            restaurant = Restaurant.objects.get(id=restaurant_id)
        except Restaurant.DoesNotExist:
            return Response(
                {"detail": "Restaurant not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        # Create booking
        booking = Booking.objects.create(
            customer=request.user,
            restaurant=restaurant,
            notes=notes
        )

        total_price = 0
        for item in items_data:
            visinia_id = list(item.keys())[0]
            quantity = item[visinia_id]

            try:
                visinia = Visinia.objects.get(id=visinia_id, restaurant=restaurant)
            except Visinia.DoesNotExist:
                booking.delete()
                return Response(
                    {"detail": f"Visinia {visinia_id} not found in this restaurant"},
                    status=status.HTTP_404_NOT_FOUND
                )

            item_price = visinia.price * quantity
            BookingItem.objects.create(
                booking=booking,
                visinia=visinia,
                quantity=quantity,
                price=visinia.price
            )
            total_price += item_price

        booking.total_price = total_price
        booking.save()

        return Response(
            BookingSerializer(booking).data,
            status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        """Confirm a booking (restaurant owner only)"""
        booking = self.get_object()
        if booking.restaurant.owner != request.user and not request.user.is_staff:
            return Response(
                {"detail": "You can only confirm bookings for your restaurant."},
                status=status.HTTP_403_FORBIDDEN
            )

        booking.status = 'CONFIRMED'
        booking.save()
        return Response(BookingSerializer(booking).data)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Mark booking as completed"""
        booking = self.get_object()
        if booking.restaurant.owner != request.user and not request.user.is_staff:
            return Response(
                {"detail": "Only restaurant owner or admin can complete bookings."},
                status=status.HTTP_403_FORBIDDEN
            )

        booking.status = 'COMPLETED'
        booking.save()
        return Response(BookingSerializer(booking).data)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel a booking"""
        booking = self.get_object()
        if booking.customer != request.user and booking.restaurant.owner != request.user and not request.user.is_staff:
            return Response(
                {"detail": "You don't have permission to cancel this booking."},
                status=status.HTTP_403_FORBIDDEN
            )

        booking.status = 'CANCELLED'
        booking.save()
        return Response(BookingSerializer(booking).data)

    @action(detail=False, methods=['get'])
    def my_bookings(self, request):
        """Get current user's bookings"""
        bookings = Booking.objects.filter(customer=request.user)
        serializer = self.get_serializer(bookings, many=True)
        return Response(serializer.data)


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """User registration endpoint"""
    serializer = RegistrationSerializer(data=request.data)
    if serializer.is_valid():
        try:
            user = serializer.save()
        except Exception as exc:
            return Response(
                {'detail': f'Registration failed: {str(exc)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        profile, _ = UserProfile.objects.get_or_create(user=user)
        return Response({
            'message': 'User registered successfully',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': profile.role,
                'phone': profile.phone
            }
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_register_owner(request):
    """Superuser-only endpoint to create restaurant owner accounts."""
    if not request.user.is_superuser:
        return Response(
            {'detail': 'Only superusers can register restaurant owners.'},
            status=status.HTTP_403_FORBIDDEN
        )

    serializer = AdminOwnerRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        try:
            user = serializer.save()
        except Exception as exc:
            return Response(
                {'detail': f'Owner registration failed: {str(exc)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        profile, _ = UserProfile.objects.get_or_create(user=user)
        return Response({
            'message': 'Restaurant owner registered successfully',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': profile.role,
                'phone': profile.phone
            }
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
