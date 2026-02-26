from django.contrib import admin
from .models import UserProfile, Restaurant, Visinia, Booking, BookingItem


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'role', 'phone', 'created_at']
    list_filter = ['role', 'created_at']
    search_fields = ['user__username', 'user__email', 'phone']


@admin.register(Restaurant)
class RestaurantAdmin(admin.ModelAdmin):
    list_display = ['name', 'owner', 'phone', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'address', 'owner__username']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Visinia)
class VisioniaAdmin(admin.ModelAdmin):
    list_display = ['name', 'restaurant', 'price', 'is_available', 'created_at']
    list_filter = ['is_available', 'created_at', 'restaurant']
    search_fields = ['name', 'restaurant__name']
    readonly_fields = ['created_at', 'updated_at']


class BookingItemInline(admin.TabularInline):
    model = BookingItem
    extra = 0


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ['id', 'customer', 'restaurant', 'status', 'total_price', 'created_at']
    list_filter = ['status', 'created_at', 'restaurant']
    search_fields = ['customer__username', 'restaurant__name']
    readonly_fields = ['created_at', 'updated_at']
    inlines = [BookingItemInline]
