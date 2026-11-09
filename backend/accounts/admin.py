from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

@admin.register(User)
class PlatformUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (("PawTrail", {"fields": ("display_name",)}),)
