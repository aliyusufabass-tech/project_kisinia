from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from .models import UserProfile, Restaurant, Visinia, Booking


class AuthenticationTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@test.com',
            password='testpass123'
        )
        UserProfile.objects.create(user=self.user, role='CUSTOMER')

    def test_user_creation(self):
        self.assertEqual(self.user.username, 'testuser')
        self.assertEqual(self.user.profile.role, 'CUSTOMER')


class RestaurantTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.owner = User.objects.create_user(
            username='owner',
            email='owner@test.com',
            password='testpass123'
        )
        UserProfile.objects.create(user=self.owner, role='RESTAURANT_OWNER')
        
        self.restaurant = Restaurant.objects.create(
            owner=self.owner,
            name='Test Restaurant',
            address='123 Test St',
            phone='1234567890'
        )

    def test_restaurant_creation(self):
        self.assertEqual(self.restaurant.name, 'Test Restaurant')
        self.assertEqual(self.restaurant.owner, self.owner)


class VisioniaTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.owner = User.objects.create_user(
            username='owner',
            password='testpass123'
        )
        UserProfile.objects.create(user=self.owner, role='RESTAURANT_OWNER')
        
        self.restaurant = Restaurant.objects.create(
            owner=self.owner,
            name='Test Restaurant',
            address='123 Test St',
            phone='1234567890'
        )
        
        self.visinia = Visinia.objects.create(
            restaurant=self.restaurant,
            name='Test Dish',
            description='A delicious test dish',
            price='9.99'
        )

    def test_visinia_creation(self):
        self.assertEqual(self.visinia.name, 'Test Dish')
        self.assertEqual(self.visinia.restaurant, self.restaurant)
