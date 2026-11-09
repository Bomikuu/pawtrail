from django.utils import timezone
from rest_framework import serializers
import math

class LocationInput(serializers.Serializer):
    latitude = serializers.FloatField(min_value=-90, max_value=90)
    longitude = serializers.FloatField(min_value=-180, max_value=180)
    accuracyMeters = serializers.FloatField(min_value=0, max_value=100000, allow_null=True)
    measuredAt = serializers.DateTimeField(allow_null=True)
    source = serializers.ChoiceField(choices=["device", "manual", "exif"])
    def validate(self, data):
        if any(not math.isfinite(data[key]) for key in ["latitude", "longitude"]):
            raise serializers.ValidationError("Coordinates must be finite numbers.")
        if data.get("accuracyMeters") is not None and not math.isfinite(data["accuracyMeters"]):
            raise serializers.ValidationError("Location accuracy must be finite.")
        return data

class CaptureInput(serializers.Serializer):
    mediaId = serializers.UUIDField()
    source = serializers.ChoiceField(choices=["browser_camera", "device_capture", "gallery"])
    capturedAt = serializers.DateTimeField(allow_null=True)
    location = LocationInput(allow_null=True)
    areaLabel = serializers.CharField(max_length=120, allow_blank=True, default="")
    cloudConsent = serializers.BooleanField(default=False)
    def validate(self, data):
        now = timezone.now()
        if data.get("capturedAt") and (data["capturedAt"] - now).total_seconds() > 300:
            raise serializers.ValidationError("The capture time cannot be in the future.")
        location = data.get("location")
        if location and location.get("measuredAt") and (location["measuredAt"] - now).total_seconds() > 300:
            raise serializers.ValidationError("The location timestamp cannot be in the future.")
        if data["source"] == "gallery" and location and location["source"] == "device":
            raise serializers.ValidationError("Current device location cannot be assigned to an imported photograph. Use its capture location or leave it unknown.")
        return data

class CropInput(serializers.Serializer):
    x = serializers.FloatField(min_value=0, max_value=1)
    y = serializers.FloatField(min_value=0, max_value=1)
    width = serializers.FloatField(min_value=0.01, max_value=1)
    height = serializers.FloatField(min_value=0.01, max_value=1)
    def validate(self, value):
        if any(not math.isfinite(v) for v in value.values()):
            raise serializers.ValidationError("Crop coordinates must be finite.")
        if value["x"] + value["width"] > 1.001 or value["y"] + value["height"] > 1.001:
            raise serializers.ValidationError("The selected animal must stay inside the photo.")
        return value

class SelectionInput(serializers.Serializer):
    version = serializers.IntegerField(min_value=1)
    crop = CropInput(allow_null=True)

class SubmissionInput(serializers.Serializer):
    observationVersion = serializers.IntegerField(min_value=1)
    proposedAnimalId = serializers.UUIDField(allow_null=True, default=None)
    registerNew = serializers.BooleanField(default=False)
    allowAutomaticMatch = serializers.BooleanField(default=False)
    name = serializers.CharField(max_length=100, allow_blank=True, default="")
    description = serializers.CharField(max_length=3000, allow_blank=True, default="")
    notes = serializers.CharField(max_length=3000, allow_blank=True, default="")
    def validate(self, data):
        if data["registerNew"] and data["proposedAnimalId"]:
            raise serializers.ValidationError("Choose an existing animal or a provisional registration, not both.")
        return data

class ReviewInput(serializers.Serializer):
    version = serializers.IntegerField(min_value=1)
    action = serializers.ChoiceField(choices=["confirm", "reassign", "reject", "dispute"])
    animalId = serializers.UUIDField(allow_null=True, default=None)
    reason = serializers.CharField(min_length=10, max_length=3000)
    evidenceAccepted = serializers.BooleanField(default=False)

class ReferenceInput(serializers.Serializer):
    observationId = serializers.UUIDField()
    viewpoint = serializers.ChoiceField(choices=["face", "left", "right", "body", "other"])
    provenance = serializers.CharField(min_length=10, max_length=3000)
    traits = serializers.DictField(child=serializers.CharField(max_length=200), default=dict)
