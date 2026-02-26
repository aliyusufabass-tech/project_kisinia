# Creating Administrator Accounts

Administrator (superuser) accounts should **NOT** be created through the public registration interface. Instead, they must be created through the Django management command.

## Method 1: Using Django Management Command (Recommended)

1. Navigate to the project directory:
```bash
cd /Users/phantomx/Desktop/kisiniaVersion1
```

2. Activate the virtual environment:
```bash
source venv/bin/activate
```

3. Run the createsuperuser command:
```bash
python manage.py createsuperuser
```

4. Follow the prompts to enter:
   - Username (e.g., `admin`)
   - Email address
   - Password
   - Password confirmation

## Method 2: Using Django Shell

1. Navigate to the project directory and activate virtual environment:
```bash
cd /Users/phantomx/Desktop/kisiniaVersion1
source venv/bin/activate
```

2. Open Django shell:
```bash
python manage.py shell
```

3. Create superuser programmatically:
```python
from django.contrib.auth.models import User
from core.models import UserProfile

# Create superuser
admin_user = User.objects.create_user(
    username='admin',
    email='admin@kisinia.com',
    password='your_secure_password',
    first_name='System',
    last_name='Administrator',
    is_staff=True,
    is_superuser=True
)

# Create profile with ADMIN role
UserProfile.objects.create(
    user=admin_user,
    role='ADMIN',
    phone='0000000000'
)

print(f"Admin user created: {admin_user.username}")
```

## Security Notes

- ⚠️ **Never** create admin accounts through the public API
- 🔒 Admin accounts have full system access
- 📝 Keep admin credentials secure and change passwords regularly
- 🚀 Only grant admin access to trusted personnel

## Available User Roles

- **CUSTOMER**: Can order food from restaurants (available for public registration)
- **RESTAURANT_OWNER**: Can manage restaurants and menu items (available for public registration)
- **ADMIN**: Full system administration (requires superuser creation via terminal)

## Accessing Admin Panel

After creating a superuser, you can access the Django admin panel at:
```
http://127.0.0.1:8000/admin/
```

Login with your superuser credentials to manage users, restaurants, bookings, and other system data.
