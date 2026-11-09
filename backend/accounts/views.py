from datetime import datetime, timezone as datetime_timezone
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.db.models import Q
from rest_framework import serializers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from config.errors import DomainError

class Registration(serializers.Serializer):
    email = serializers.EmailField(max_length=254)
    username = serializers.RegexField(r"^[a-zA-Z0-9_-]{3,40}$")
    displayName = serializers.CharField(max_length=100)
    password = serializers.CharField(max_length=256, trim_whitespace=False)
    avatarId = serializers.RegexField(r"^pawtrail-avatar-(0[1-9]|[12][0-9]|30)$", required=False)

def is_reviewer(user):
    return user.is_authenticated and (user.is_staff or user.groups.filter(name="identity_reviewers").exists())

def session(user, expires=None):
    actor = None
    roles = []
    if user and user.is_authenticated:
        from social.people import roles as social_roles, avatar
        roles = social_roles(user)
        if is_reviewer(user) and "moderator" not in roles:
            roles.append("moderator")
        actor = {"id": str(user.pk), "username": user.username, "displayName": user.display_name or user.username,
                 "roles": roles, "shelterIds": [str(x) for x in user.shelters.values_list("pk",flat=True)]+[str(x) for x in user.managed_shelters.values_list("pk",flat=True)], "avatar": avatar(user)}
    return {"actor": actor, "roles": roles, "demo": False, "mode": "real",
            "cacheScope": "platform-" + (str(user.pk) if actor else "anonymous"), "expiresAt": expires}

def tokens(user):
    refresh = RefreshToken.for_user(user)
    expires = datetime.fromtimestamp(refresh.access_token["exp"], datetime_timezone.utc).isoformat()
    return {"access": str(refresh.access_token), "refresh": str(refresh), "session": session(user, expires)}

@api_view(["POST"])
@permission_classes([AllowAny])
def register(request):
    payload = dict(request.data)
    if "display_name" in payload and "displayName" not in payload:
        payload["displayName"] = payload.pop("display_name")
    if "avatar_id" in payload and "avatarId" not in payload:
        payload["avatarId"] = payload.pop("avatar_id")
    data = Registration(data=payload)
    data.is_valid(raise_exception=True)
    value = data.validated_data
    user = get_user_model()(email=value["email"].lower(), username=value["username"], display_name=value["displayName"])
    try:
        validate_password(value["password"], user)
    except ValidationError as error:
        raise serializers.ValidationError({"password": error.messages})
    try:
        with transaction.atomic():
            user.set_password(value["password"])
            user.save()
            if value.get("avatarId"):
                user.social_profile.avatar_id = value["avatarId"]
                user.social_profile.save(update_fields=["avatar_id"])
    except IntegrityError:
        raise DomainError("That email or username is already registered.", "ACCOUNT_EXISTS", 409)
    return Response(tokens(user), status=201)

@api_view(["POST"])
@permission_classes([AllowAny])
def login(request):
    email = str(request.data.get("email", "")).strip()
    password = str(request.data.get("password", ""))
    user = get_user_model().objects.filter(Q(email__iexact=email) | Q(username__iexact=email)).first()
    if not user or not user.is_active or not user.check_password(password):
        raise DomainError("Email or password is incorrect.", "INVALID_CREDENTIALS", 401)
    return Response(tokens(user))

@api_view(["GET"])
@permission_classes([AllowAny])
def current_session(request):
    return Response(session(request.user))

@api_view(["POST"])
def logout(request):
    if request.data.get("refresh"):
        try:
            token = RefreshToken(request.data["refresh"])
            if str(token["user_id"]) == str(request.user.pk):
                token.blacklist()
        except Exception:
            pass
    return Response(status=204)
