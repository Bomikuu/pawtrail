import uuid
from django.conf import settings
from django.db import models
from django.db.models import Q

USER = settings.AUTH_USER_MODEL

class GenuineRecords(models.Manager):
    """Verification and reward eligibility always exclude generated records."""
    def get_queryset(self):
        return super().get_queryset().filter(is_fixture=False)

class CommunityRecords(models.Manager):
    """Browse persisted local fixtures without making them verified activity."""
    def get_queryset(self):
        rows = super().get_queryset()
        return rows if settings.COMMUNITY_FIXTURES_VISIBLE else rows.filter(is_fixture=False)

class Record(models.Model):
    objects = CommunityRecords()
    genuine_objects = GenuineRecords()
    # Explicit maintenance access; FK resolution keeps Django's unfiltered base manager.
    all_objects = models.Manager()
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    version = models.PositiveIntegerField(default=1)
    is_fixture = models.BooleanField(default=False, db_index=True)
    seed_key = models.CharField(max_length=150, unique=True, null=True, blank=True)
    class Meta:
        abstract = True

class Area(Record):
    slug = models.SlugField(unique=True)
    name = models.CharField(max_length=150)
    latitude = models.FloatField()
    longitude = models.FloatField()
    radius = models.PositiveIntegerField(default=1500)

class UserProfile(models.Model):
    user = models.OneToOneField(USER, primary_key=True, on_delete=models.CASCADE, related_name="social_profile")
    bio = models.TextField(blank=True)
    avatar_id = models.CharField(max_length=40, blank=True)
    banner_id = models.CharField(max_length=40, default="meadow")
    area = models.ForeignKey(Area, null=True, blank=True, on_delete=models.SET_NULL)
    show_location = models.BooleanField(default=False)
    show_contributions = models.BooleanField(default=True)
    discoverable = models.BooleanField(default=True)
    public_attendance = models.BooleanField(default=False)
    is_fixture = models.BooleanField(default=False, db_index=True)
    seed_key = models.CharField(max_length=150, unique=True, null=True, blank=True)

class Shelter(Record):
    slug = models.SlugField(unique=True)
    name = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    location = models.JSONField()
    owner = models.ForeignKey(USER, on_delete=models.PROTECT, related_name="managed_shelters")
    staff = models.ManyToManyField(USER, related_name="shelters", blank=True)
    published = models.BooleanField(default=False)
    verified = models.BooleanField(default=False)
    photo = models.ForeignKey("media.Asset", null=True, blank=True, on_delete=models.PROTECT)

class Horde(Record):
    slug = models.SlugField(unique=True)
    name = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    location = models.JSONField()
    owner = models.ForeignKey(USER, on_delete=models.PROTECT, related_name="managed_hordes")
    contributors = models.ManyToManyField(USER, blank=True)
    published = models.BooleanField(default=False)
    photo = models.ForeignKey("media.Asset", null=True, blank=True, on_delete=models.PROTECT)

class AnimalInfo(Record):
    source_kind = models.CharField(max_length=20, default="manual")
    animal = models.OneToOneField("animals.Animal", on_delete=models.CASCADE, related_name="social_info")
    caretaker = models.ForeignKey(USER, on_delete=models.PROTECT, related_name="care_animals")
    shelter = models.ForeignKey(Shelter, null=True, blank=True, on_delete=models.PROTECT, related_name="animals")
    horde = models.ForeignKey(Horde, null=True, blank=True, on_delete=models.PROTECT, related_name="animals")
    age_months = models.PositiveIntegerField(null=True, blank=True)
    gender = models.CharField(max_length=10, default="unknown")
    size = models.CharField(max_length=10, default="unknown")
    status = models.CharField(max_length=20, default="community")
    adoptable = models.BooleanField(default=False)
    location = models.JSONField()
    personality = models.JSONField(default=list)
    behavior = models.JSONField(default=list)
    characteristics = models.JSONField(default=list)
    needs = models.JSONField(default=dict)
    observed_condition = models.TextField(blank=True)
    banner_id = models.CharField(max_length=40, default="meadow")
    published = models.BooleanField(default=False)
    private_evidence = models.ManyToManyField("media.Asset", related_name="animal_profile_evidence", blank=True)

class Mission(Record):
    slug = models.SlugField(unique=True)
    title = models.CharField(max_length=200)
    description = models.TextField()
    organizer = models.ForeignKey(USER, on_delete=models.PROTECT, related_name="organized_missions")
    animal = models.ForeignKey("animals.Animal", null=True, blank=True, on_delete=models.PROTECT, related_name="social_missions")
    shelter = models.ForeignKey(Shelter, null=True, blank=True, on_delete=models.PROTECT, related_name="missions")
    horde = models.ForeignKey(Horde, null=True, blank=True, on_delete=models.PROTECT, related_name="missions")
    kind = models.CharField(max_length=10, default="mission")
    urgency = models.CharField(max_length=10, default="normal")
    state = models.CharField(max_length=12, default="open")
    deadline = models.DateTimeField()
    reward_kibble = models.PositiveIntegerField(default=0)
    location = models.JSONField()
    evidence_requirements = models.JSONField(default=list)

class MissionParticipation(Record):
    mission = models.ForeignKey(Mission, on_delete=models.PROTECT, related_name="participations")
    volunteer = models.ForeignKey(USER, on_delete=models.PROTECT, related_name="mission_participations")
    state = models.CharField(max_length=15, default="accepted")
    evidence_text = models.TextField(blank=True)
    evidence_media = models.ManyToManyField("media.Asset", blank=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewer = models.ForeignKey(USER, null=True, blank=True, on_delete=models.PROTECT, related_name="mission_reviews")
    review_reason = models.TextField(blank=True)
    credited = models.PositiveIntegerField(default=0)
    reward_revision = models.PositiveIntegerField(default=0)
    class Meta:
        constraints = [models.UniqueConstraint(fields=["mission", "volunteer"], name="one_mission_participation")]

class AdoptionPreferences(models.Model):
    user = models.OneToOneField(USER, primary_key=True, on_delete=models.CASCADE)
    values = models.JSONField(default=dict)

class AdoptionInterest(Record):
    user = models.ForeignKey(USER, on_delete=models.CASCADE)
    animal = models.ForeignKey("animals.Animal", on_delete=models.CASCADE)
    class Meta:
        constraints = [models.UniqueConstraint(fields=["user", "animal"], name="unique_adoption_interest")]

class AdoptionApplication(Record):
    animal = models.ForeignKey("animals.Animal", on_delete=models.PROTECT)
    shelter = models.ForeignKey(Shelter, on_delete=models.PROTECT, related_name="applications")
    applicant = models.ForeignKey(USER, on_delete=models.PROTECT, related_name="adoption_applications")
    status = models.CharField(max_length=24, default="draft")
    answers = models.JSONField(default=dict)
    review_message = models.TextField(blank=True)
    history = models.JSONField(default=list)
    class Meta:
        constraints = [models.UniqueConstraint(fields=["animal", "applicant"], condition=Q(status__in=["draft", "submitted", "needs_information", "approved"]), name="one_live_adoption_application"), models.UniqueConstraint(fields=["animal"], condition=Q(status="approved"), name="one_approved_animal_application")]

class Campaign(Record):
    slug = models.SlugField(unique=True)
    title = models.CharField(max_length=200)
    story = models.TextField()
    category = models.CharField(max_length=20)
    urgency = models.CharField(max_length=10, default="normal")
    state = models.CharField(max_length=20, default="pending_review")
    organizer = models.ForeignKey(USER, on_delete=models.PROTECT, related_name="campaigns")
    shelter = models.ForeignKey(Shelter, null=True, blank=True, on_delete=models.PROTECT, related_name="campaigns")
    animal = models.ForeignKey("animals.Animal", null=True, blank=True, on_delete=models.PROTECT, related_name="social_campaigns")
    horde = models.ForeignKey(Horde, null=True, blank=True, on_delete=models.PROTECT, related_name="campaigns")
    location = models.JSONField()
    goal_minor = models.PositiveBigIntegerField()
    budget = models.JSONField(default=list)
    timeline = models.TextField(blank=True)
    photos = models.ManyToManyField("media.Asset", related_name="campaign_photos", blank=True)
    private_evidence = models.ManyToManyField("media.Asset", related_name="campaign_evidence", blank=True)
    verified = models.BooleanField(default=False)
    payout_status = models.CharField(max_length=20, default="not_requested")
    class Meta:
        constraints = [models.CheckConstraint(condition=Q(goal_minor__gt=0), name="campaign_positive_goal")]

class CampaignDraft(Record):
    owner = models.ForeignKey(USER, on_delete=models.CASCADE)
    values = models.JSONField(default=dict)

class CampaignUpdate(Record):
    campaign = models.ForeignKey(Campaign, on_delete=models.PROTECT, related_name="updates")
    author = models.ForeignKey(USER, on_delete=models.PROTECT)
    text = models.TextField()
    photos = models.ManyToManyField("media.Asset", blank=True)
    post = models.ForeignKey("Post", null=True, blank=True, on_delete=models.PROTECT)

class SupportPledge(Record):
    campaign = models.ForeignKey(Campaign, on_delete=models.PROTECT, related_name="pledges")
    supporter = models.ForeignKey(USER, on_delete=models.PROTECT)
    amount_minor = models.PositiveBigIntegerField()
    message = models.TextField(blank=True)
    anonymous = models.BooleanField(default=False)
    status = models.CharField(max_length=20, default="pledged")
    class Meta:
        constraints = [models.CheckConstraint(condition=Q(amount_minor__gte=100), name="pledge_minimum_amount")]

class CampaignExpense(Record):
    campaign = models.ForeignKey(Campaign, on_delete=models.PROTECT, related_name="expenses")
    author = models.ForeignKey(USER, on_delete=models.PROTECT)
    amount_minor = models.PositiveBigIntegerField()
    description = models.TextField()
    corrects_entry = models.OneToOneField("self", null=True, blank=True, on_delete=models.PROTECT, related_name="correction")
    receipts = models.ManyToManyField("media.Asset", blank=True)
    class Meta:
        constraints = [models.CheckConstraint(condition=Q(amount_minor__gt=0), name="expense_positive_amount")]

class Event(Record):
    slug = models.SlugField(unique=True)
    title = models.CharField(max_length=200)
    description = models.TextField()
    organizer = models.ForeignKey(USER, on_delete=models.PROTECT, related_name="organized_events")
    shelter = models.ForeignKey(Shelter, null=True, blank=True, on_delete=models.PROTECT, related_name="events")
    starts_at = models.DateTimeField()
    ends_at = models.DateTimeField()
    venue = models.JSONField()
    capacity = models.PositiveIntegerField()
    state = models.CharField(max_length=15, default="scheduled")
    class Meta:
        constraints = [models.CheckConstraint(condition=Q(ends_at__gt=models.F("starts_at")), name="event_ordered_times"),
                       models.CheckConstraint(condition=Q(capacity__gt=0), name="event_positive_capacity")]

class EventRsvp(Record):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="rsvps")
    attendee = models.ForeignKey(USER, on_delete=models.CASCADE)
    public = models.BooleanField(default=False)
    class Meta:
        constraints = [models.UniqueConstraint(fields=["event", "attendee"], name="one_event_rsvp")]

class Post(Record):
    author = models.ForeignKey(USER, on_delete=models.PROTECT, related_name="community_posts")
    text = models.TextField()
    kind = models.CharField(max_length=20, default="story")
    moderation = models.CharField(max_length=15, default="published")
    refs = models.JSONField(default=list)
    photos = models.ManyToManyField("media.Asset", blank=True)

class Comment(Record):
    author = models.ForeignKey(USER, on_delete=models.PROTECT)
    ref_kind = models.CharField(max_length=20)
    ref_id = models.UUIDField()
    text = models.TextField()
    moderation = models.CharField(max_length=15, default="published")

class Reaction(Record):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="reactions")
    user = models.ForeignKey(USER, on_delete=models.CASCADE)
    class Meta:
        constraints = [models.UniqueConstraint(fields=["post", "user"], name="one_post_reaction")]

class Saved(Record):
    user = models.ForeignKey(USER, on_delete=models.CASCADE)
    kind = models.CharField(max_length=20)
    target_id = models.UUIDField()
    class Meta:
        constraints = [models.UniqueConstraint(fields=["user", "kind", "target_id"], name="one_saved_target")]

class Follow(Record):
    user = models.ForeignKey(USER, on_delete=models.CASCADE)
    kind = models.CharField(max_length=20)
    target_id = models.UUIDField()
    class Meta:
        constraints = [models.UniqueConstraint(fields=["user", "kind", "target_id"], name="one_follow_target")]

class Notification(Record):
    recipient = models.ForeignKey(USER, on_delete=models.CASCADE, related_name="social_notifications")
    kind = models.CharField(max_length=20)
    message = models.CharField(max_length=500)
    ref = models.JSONField(null=True, blank=True)
    read_at = models.DateTimeField(null=True, blank=True)

class Audit(Record):
    actor = models.ForeignKey(USER, on_delete=models.PROTECT)
    kind = models.CharField(max_length=40)
    target_id = models.UUIDField()
    action = models.CharField(max_length=40)
    reason = models.TextField(blank=True)
    before_version = models.PositiveIntegerField()
    after_version = models.PositiveIntegerField()

class Mutation(models.Model):
    owner = models.ForeignKey(USER, on_delete=models.CASCADE)
    key = models.CharField(max_length=120)
    scope = models.CharField(max_length=250)
    fingerprint = models.CharField(max_length=64)
    result = models.JSONField(null=True)
    status = models.PositiveIntegerField(default=200)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        constraints = [models.UniqueConstraint(fields=["owner", "key", "scope"], name="unique_social_mutation")]

class FundReceipt(Record):
    campaign = models.ForeignKey(Campaign, on_delete=models.PROTECT, related_name="fund_receipts")
    pledge = models.OneToOneField(SupportPledge, on_delete=models.PROTECT)
    reviewer = models.ForeignKey(USER, on_delete=models.PROTECT)
    amount_minor = models.PositiveBigIntegerField()
    reference = models.CharField(max_length=200, unique=True)
    evidence = models.ManyToManyField("media.Asset")
    class Meta:
        constraints = [models.CheckConstraint(condition=Q(amount_minor__gt=0), name="fund_receipt_positive_amount")]

class ContentReport(Record):
    reporter = models.ForeignKey(USER, on_delete=models.PROTECT)
    ref_kind = models.CharField(max_length=20)
    ref_id = models.UUIDField()
    reason = models.CharField(max_length=40)
    details = models.TextField(blank=True)

class AchievementClaim(Record):
    user = models.ForeignKey(USER, on_delete=models.PROTECT, related_name='achievement_claims')
    badge_id = models.CharField(max_length=60)
    state = models.CharField(max_length=10, choices=[('active', 'Active'), ('revoked', 'Revoked')], default='revoked')
    claimed_at = models.DateTimeField()
    reward_kibble = models.PositiveIntegerField()
    credited = models.PositiveIntegerField(default=0)
    reward_revision = models.PositiveIntegerField(default=0)
    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['user', 'badge_id'], name='one_achievement_claim'),
            models.CheckConstraint(condition=Q(reward_kibble__gt=0), name='achievement_reward_positive'),
            models.CheckConstraint(condition=Q(credited__lte=models.F('reward_kibble')), name='achievement_credit_bounded'),
            models.CheckConstraint(condition=Q(state__in=['active', 'revoked']), name='achievement_claim_state'),
        ]

class AchievementActivity(Record):
    user = models.ForeignKey(USER, on_delete=models.PROTECT, related_name='achievement_activities')
    kind = models.CharField(max_length=12, choices=[('daily', 'Daily'), ('discovery', 'Discovery'), ('share', 'Share')])
    ref_kind = models.CharField(max_length=20, blank=True)
    ref_id = models.UUIDField(null=True, blank=True)
    activity_day = models.DateField(null=True, blank=True)
    dedup_key = models.CharField(max_length=120)
    class Meta:
        indexes = [models.Index(fields=['ref_kind', 'ref_id'], name='achievement_activity_ref')]
        constraints = [
            models.UniqueConstraint(fields=['user', 'dedup_key'], name='one_achievement_activity'),
            models.CheckConstraint(condition=(Q(kind='daily', ref_kind='', ref_id__isnull=True, activity_day__isnull=False) | Q(kind='discovery', ref_kind='animal', ref_id__isnull=False, activity_day__isnull=True) | Q(kind='share', ref_kind__in=['animal', 'mission', 'fundraiser'], ref_id__isnull=False, activity_day__isnull=True)), name='achievement_activity_shape'),
        ]

class AchievementProof(Record):
    user = models.ForeignKey(USER, on_delete=models.PROTECT, related_name='achievement_proofs')
    badge_id = models.CharField(max_length=60)
    ref_kind = models.CharField(max_length=20)
    ref_id = models.UUIDField()
    occurred_at = models.DateTimeField()
    reference_version = models.PositiveIntegerField(null=True, blank=True)
    details = models.TextField(max_length=2000)
    media = models.ManyToManyField('media.Asset', related_name='achievement_proofs')
    dedup_key = models.CharField(max_length=160)
    state = models.CharField(max_length=10, choices=[('pending', 'Pending'), ('approved', 'Approved'), ('rejected', 'Rejected')], default='pending')
    reviewer = models.ForeignKey(USER, null=True, blank=True, on_delete=models.PROTECT, related_name='reviewed_achievement_proofs')
    reason = models.TextField(blank=True, max_length=2000)
    class Meta:
        indexes = [
            models.Index(fields=['ref_kind', 'ref_id'], name='achievement_proof_ref'),
            models.Index(fields=['is_fixture', 'state', '-created_at', '-id'], name='achievement_review_queue'),
        ]
        constraints = [
            models.UniqueConstraint(fields=['user', 'dedup_key'], name='one_achievement_proof_activity'),
            models.UniqueConstraint(fields=['ref_id'], condition=Q(badge_id='community-builder', state='approved', is_fixture=False), name='one_approved_referral'),
            models.CheckConstraint(condition=Q(reviewer__isnull=True) | ~Q(reviewer=models.F('user')), name='independent_achievement_review'),
            models.CheckConstraint(condition=Q(state__in=['pending', 'approved', 'rejected']), name='achievement_proof_state'),
        ]

class AchievementShowcase(Record):
    user = models.OneToOneField(USER, on_delete=models.CASCADE, related_name='achievement_showcase')
    badge_ids = models.JSONField(default=list)
    show_mastery = models.BooleanField(default=False)

from .medical_models import AnimalMedicalRecord, AnimalMedicalRevision
