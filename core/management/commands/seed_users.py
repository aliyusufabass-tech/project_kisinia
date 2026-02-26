from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from core.models import UserProfile


class Command(BaseCommand):
    help = 'Create default users: Admin, Restaurant Owner A, Customer B, Customer C'

    def handle(self, *args, **options):
        # Create Admin User
        admin_user, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@kisinia.com',
                'first_name': 'Admin',
                'last_name': 'User',
                'is_staff': True,
                'is_superuser': True,
            }
        )
        if created:
            admin_user.set_password('admin123')
            admin_user.save()
            self.stdout.write(self.style.SUCCESS('Created Admin user'))
        else:
            self.stdout.write(self.style.WARNING('Admin user already exists'))

        UserProfile.objects.get_or_create(
            user=admin_user,
            defaults={'role': 'ADMIN', 'phone': '+1234567890'}
        )

        # Create Restaurant Owner A
        owner_a, created = User.objects.get_or_create(
            username='owner_a',
            defaults={
                'email': 'ownera@kisinia.com',
                'first_name': 'Restaurant',
                'last_name': 'Owner A',
            }
        )
        if created:
            owner_a.set_password('owneradmin123')
            owner_a.save()
            self.stdout.write(self.style.SUCCESS('Created Restaurant Owner A user'))
        else:
            self.stdout.write(self.style.WARNING('Restaurant Owner A already exists'))

        UserProfile.objects.get_or_create(
            user=owner_a,
            defaults={'role': 'RESTAURANT_OWNER', 'phone': '+9876543210'}
        )

        # Create Customer B
        customer_b, created = User.objects.get_or_create(
            username='customer_b',
            defaults={
                'email': 'customerb@kisinia.com',
                'first_name': 'Customer',
                'last_name': 'B',
            }
        )
        if created:
            customer_b.set_password('customerb123')
            customer_b.save()
            self.stdout.write(self.style.SUCCESS('Created Customer B user'))
        else:
            self.stdout.write(self.style.WARNING('Customer B already exists'))

        UserProfile.objects.get_or_create(
            user=customer_b,
            defaults={'role': 'CUSTOMER', 'phone': '+1111111111'}
        )

        # Create Customer C
        customer_c, created = User.objects.get_or_create(
            username='customer_c',
            defaults={
                'email': 'customerc@kisinia.com',
                'first_name': 'Customer',
                'last_name': 'C',
            }
        )
        if created:
            customer_c.set_password('customerc123')
            customer_c.save()
            self.stdout.write(self.style.SUCCESS('Created Customer C user'))
        else:
            self.stdout.write(self.style.WARNING('Customer C already exists'))

        UserProfile.objects.get_or_create(
            user=customer_c,
            defaults={'role': 'CUSTOMER', 'phone': '+2222222222'}
        )

        self.stdout.write(self.style.SUCCESS('\n=== Users Created Successfully ==='))
        self.stdout.write('\nDefault Credentials:')
        self.stdout.write('Admin: admin / admin123')
        self.stdout.write('Restaurant Owner A: owner_a / owneradmin123')
        self.stdout.write('Customer B: customer_b / customerb123')
        self.stdout.write('Customer C: customer_c / customerc123')
