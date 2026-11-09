from datetime import datetime
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from rest_framework import serializers
from ..common import Version


class Reference(serializers.Serializer):
    kind = serializers.ChoiceField(choices=['animal', 'mission', 'fundraiser', 'event', 'post', 'shelter', 'horde', 'user'])
    id = serializers.CharField(max_length=150)


class ClaimInput(serializers.Serializer):
    badgeId = serializers.CharField(max_length=60)


class ActivityInput(serializers.Serializer):
    kind = serializers.ChoiceField(choices=['daily', 'discovery', 'share'])
    ref = Reference(required=False)

    def validate(self, value):
        kind, ref = value['kind'], value.get('ref')
        if kind == 'daily':
            if ref:
                raise serializers.ValidationError('Daily check-in uses the server date and no reference.')
        elif not ref or (kind == 'discovery' and ref['kind'] != 'animal') or (kind == 'share' and ref['kind'] not in ['animal', 'mission', 'fundraiser']):
            raise serializers.ValidationError('Choose a published reference supported by this activity.')
        return value


class AwareDateTime(serializers.DateTimeField):
    def to_internal_value(self, value):
        try:
            parsed = parse_datetime(value) if isinstance(value, str) else value
        except (TypeError, ValueError):
            parsed = None
        if isinstance(parsed, datetime) and timezone.is_naive(parsed):
            raise serializers.ValidationError('Include a timezone with the activity date.')
        return super().to_internal_value(value)


class ProofInput(serializers.Serializer):
    id = serializers.UUIDField(required=False)
    expectedVersion = serializers.IntegerField(min_value=1, required=False)
    badgeId = serializers.CharField(max_length=60)
    ref = Reference()
    occurredAt = AwareDateTime()
    details = serializers.CharField(min_length=20, max_length=2000)
    mediaIds = serializers.ListField(child=serializers.UUIDField(), min_length=1, max_length=6)


class ReviewInput(Version):
    id = serializers.UUIDField(required=False)
    decision = serializers.ChoiceField(choices=['approved', 'rejected'])
    reason = serializers.CharField(min_length=5, max_length=2000)


class ShowcaseInput(serializers.Serializer):
    badgeIds = serializers.ListField(child=serializers.CharField(max_length=60), max_length=6)
    showMastery = serializers.BooleanField()

    def validate_badgeIds(self, values):
        if len(values) != len(set(values)):
            raise serializers.ValidationError('Choose each badge once.')
        return values
