from rest_framework import serializers
from django.contrib.auth.models import User
from django.db import transaction
import os
from .models import UserProfile, Restaurant, Visinia, Booking, BookingItem, USER_ROLES


class UserSerializer(serializers.ModelSerializer):
    profile = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_superuser', 'is_staff', 'profile']
        read_only_fields = ['id', 'is_superuser', 'is_staff']

    def get_profile(self, obj):
        try:
            profile = obj.profile
            return UserProfileSerializer(profile).data
        except:
            return None


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['id', 'role', 'phone', 'avatar', 'created_at', 'updated_at']


class RestaurantSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)
    owner_id = serializers.IntegerField(write_only=True, required=False)

    class Meta:
        model = Restaurant
        fields = ['id', 'owner', 'owner_id', 'name', 'description', 'address', 'phone', 'logo', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class VisioniaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Visinia
        fields = ['id', 'restaurant', 'name', 'description', 'price', 'image', 'is_available', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class BookingItemSerializer(serializers.ModelSerializer):
    visinia_name = serializers.CharField(source='visinia.name', read_only=True)

    class Meta:
        model = BookingItem
        fields = ['id', 'visinia', 'visinia_name', 'quantity', 'price']


class BookingSerializer(serializers.ModelSerializer):
    customer = UserSerializer(read_only=True)
    restaurant = RestaurantSerializer(read_only=True)
    items = BookingItemSerializer(many=True, read_only=True)

    class Meta:
        model = Booking
        fields = ['id', 'customer', 'restaurant', 'items', 'status', 'total_price', 'notes', 'created_at', 'updated_at']
        read_only_fields = ['id', 'customer', 'created_at', 'updated_at']


class BookingCreateSerializer(serializers.Serializer):
    restaurant_id = serializers.IntegerField()
    items = serializers.ListField(
        child=serializers.DictField(child=serializers.IntegerField()),
        help_text='List of {visinia_id: quantity}'
    )
    notes = serializers.CharField(required=False, allow_blank=True)


class RegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration with role assignment"""
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    role = serializers.ChoiceField(choices=USER_ROLES, default='CUSTOMER')
    phone = serializers.CharField(required=False, allow_blank=True, max_length=20)

    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name', 'password', 'password_confirm', 'role', 'phone']

    def validate_email(self, value):
        """Validate email is unique"""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate_username(self, value):
        """Validate username is unique"""
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value

    def validate_role(self, value):
        """Prevent ADMIN role registration through API"""
        if value == 'ADMIN':
            raise serializers.ValidationError(
                "Administrator accounts cannot be created through public registration. "
                "Please contact a system administrator."
            )
        return value

    def validate(self, attrs):
        """Validate passwords match"""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match.")
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        """Create user and profile"""
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        role = validated_data.pop('role')
        phone = validated_data.pop('phone', '')

        try:
            # Temporarily disable automatic profile creation
            os.environ['DISABLE_AUTO_CREATE_PROFILE'] = '1'
            
            user = User.objects.create_user(
                password=password,
                **validated_data
            )

            # Create profile manually with role and phone
            profile, created = UserProfile.objects.get_or_create(
                user=user,
                defaults={
                    'role': role,
                    'phone': phone
                }
            )

            # If profile already existed, update it
            if not created:
                profile.role = role
                profile.phone = phone
                profile.save()

            return user
        except Exception as e:
            # Re-raise the exception to be handled by the view
            raise e
        finally:
            # Re-enable automatic profile creation
            os.environ.pop('DISABLE_AUTO_CREATE_PROFILE', None)
