import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.db.models.functions import Lower

class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    display_name = models.CharField(max_length=100)
    class Meta:
        constraints = [models.UniqueConstraint(Lower("email"), name="account_email_casefold_unique"),
                       models.UniqueConstraint(Lower("username"), name="account_username_casefold_unique")]
