import uuid
from django.conf import settings
from django.db import models

class Wallet(models.Model):
    owner = models.OneToOneField(settings.AUTH_USER_MODEL, primary_key=True, on_delete=models.PROTECT)
    balance = models.BigIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        constraints = [models.CheckConstraint(condition=models.Q(balance__gte=0), name="wallet_nonnegative")]

class EncounterGrant(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    observation = models.OneToOneField("observations.Observation", on_delete=models.PROTECT, related_name="reward_grant")
    animal = models.ForeignKey("animals.Animal", null=True, on_delete=models.PROTECT)
    reward_day = models.DateField(null=True)
    amount = models.PositiveIntegerField(default=10)
    credited = models.PositiveIntegerField(default=0)
    revision = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=32, default="pending_review")
    reason = models.CharField(max_length=200, blank=True)
    policy_version = models.CharField(max_length=60, default="verified-sighting-v1")
    updated_at = models.DateTimeField(auto_now=True)

class ImmutableLedgerQuerySet(models.QuerySet):
    def update(self, **kwargs):
        raise ValueError("Kibble history is append-only; create a reversal entry.")
    def delete(self):
        raise ValueError("Kibble history cannot be deleted.")

class LedgerEntry(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    grant = models.ForeignKey(EncounterGrant, null=True, blank=True, on_delete=models.PROTECT)
    mission_participation = models.ForeignKey("social.MissionParticipation", null=True, blank=True, on_delete=models.PROTECT)
    achievement_claim = models.ForeignKey("social.AchievementClaim", null=True, blank=True, on_delete=models.PROTECT)
    revision = models.PositiveIntegerField()
    amount = models.IntegerField()
    balance_after = models.BigIntegerField()
    reason = models.CharField(max_length=40)
    description = models.CharField(max_length=250)
    animal_id_snapshot = models.UUIDField(null=True)
    animal_name_snapshot = models.CharField(max_length=100, blank=True)
    reward_day = models.DateField(null=True)
    observation_version = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    objects = ImmutableLedgerQuerySet.as_manager()
    class Meta:
        constraints = [models.UniqueConstraint(fields=["grant", "revision"], name="kibble_grant_revision_unique"),
                       models.UniqueConstraint(fields=["mission_participation", "revision"], condition=models.Q(mission_participation__isnull=False), name="mission_reward_revision_unique"),
                       models.UniqueConstraint(fields=["achievement_claim", "revision"], condition=models.Q(achievement_claim__isnull=False), name="achievement_reward_revision_unique"),
                       models.CheckConstraint(condition=(models.Q(grant__isnull=False, mission_participation__isnull=True, achievement_claim__isnull=True) | models.Q(grant__isnull=True, mission_participation__isnull=False, achievement_claim__isnull=True) | models.Q(grant__isnull=True, mission_participation__isnull=True, achievement_claim__isnull=False)), name="ledger_exactly_one_source"),
                       models.CheckConstraint(condition=~models.Q(amount=0), name="kibble_entry_nonzero"),
                       models.CheckConstraint(condition=models.Q(balance_after__gte=0), name="kibble_entry_balance_nonnegative")]
    def save(self, *args, **kwargs):
        if not self._state.adding:
            raise ValueError("Kibble history is append-only.")
        return super().save(*args, **kwargs)
    def delete(self, *args, **kwargs):
        raise ValueError("Kibble history cannot be deleted.")
