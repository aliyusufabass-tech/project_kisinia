from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User
import os

from .models import UserProfile


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    # Allow disabling automatic profile creation (useful when loading fixtures)
    if os.environ.get('DISABLE_AUTO_CREATE_PROFILE'):
        return
    if created:
        UserProfile.objects.create(user=instance)
