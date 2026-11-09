import uuid
from django.db import models
class PlayerGameProfile(models.Model):
    ability_state=models.JSONField(default=dict)
    companion_order=models.JSONField(default=list)
    can_review_map=models.BooleanField(default=False)
    supplies=models.JSONField(default=dict)
    id=models.CharField(primary_key=True,max_length=160)
    username=models.CharField(max_length=100)
    name=models.CharField(max_length=120)
    avatar=models.URLField(blank=True)
    sample=models.BooleanField(default=False)
    appearance=models.CharField(max_length=40,default='rescuer')
    visible=models.BooleanField(default=True)
    quiet=models.BooleanField(default=False)
    wallet=models.PositiveIntegerField(default=250)
    inventory=models.JSONField(default=dict)
    facts=models.JSONField(default=list)
    claimed=models.JSONField(default=list)
    favorites=models.JSONField(default=list)
    notifications=models.JSONField(default=list)
    updated=models.DateTimeField(auto_now=True)
    @property
    def is_authenticated(self):return True
class PlayerHouse(models.Model):
    object_states=models.JSONField(default=dict)
    map_area=models.CharField(max_length=30,blank=True,default='')
    owner=models.OneToOneField(PlayerGameProfile,on_delete=models.CASCADE,primary_key=True)
    name=models.CharField(max_length=100)
    visibility=models.CharField(max_length=20,default='friends')
    opened=models.BooleanField(default=True)
    permissions=models.JSONField(default=dict)
    layout=models.JSONField(default=list)
    interior_preset=models.CharField(max_length=40,default='studio')
    upstairs_layout=models.JSONField(default=list)
    upstairs_revision=models.PositiveIntegerField(default=1)
    layout_backups=models.JSONField(default=list)
    unlocked_presets=models.JSONField(default=list)
    yard_layout=models.JSONField(default=list)
    yard_revision=models.PositiveIntegerField(default=1)
    exterior=models.CharField(max_length=40,default='starter-house')
    yard_public=models.BooleanField(default=False)
    community_slot=models.PositiveIntegerField(null=True,blank=True)
    floor=models.CharField(max_length=50,default='oak-light-a')
    wallpaper=models.CharField(max_length=30,default='cream')
    revision=models.PositiveIntegerField(default=1)
    upgrades=models.JSONField(default=list)
class HouseRoom(models.Model):
    house=models.ForeignKey(PlayerHouse,on_delete=models.CASCADE)
    key=models.CharField(max_length=30)
    class Meta:constraints=[models.UniqueConstraint(fields=['house','key'],name='unique_house_room')]
class PetGameProfile(models.Model):
    game_position=models.JSONField(default=dict)
    food=models.FloatField(default=75)
    water=models.FloatField(default=75)
    needs_updated=models.DateTimeField(null=True)
    need_cycles=models.JSONField(default=dict)
    following=models.ForeignKey(PlayerGameProfile,on_delete=models.SET_NULL,null=True,related_name='companions')
    current_room=models.CharField(max_length=180,blank=True)
    command=models.JSONField(default=dict)

    map_visible=models.BooleanField(default=False)
    id=models.CharField(primary_key=True,max_length=160)
    owner=models.ForeignKey(PlayerGameProfile,on_delete=models.CASCADE)
    snapshot=models.JSONField(default=dict)
    sprite=models.CharField(max_length=40,default='orange-tabby')
    friendship=models.PositiveIntegerField(default=0)
    activity=models.CharField(max_length=30,default='idle')
    last_care=models.JSONField(default=dict)
    memories=models.JSONField(default=list)
    favorite_food=models.CharField(max_length=80,blank=True)
    favorite_toy=models.CharField(max_length=80,blank=True)
class FriendRequest(models.Model):
    sender=models.ForeignKey(PlayerGameProfile,on_delete=models.CASCADE,related_name='+')
    recipient=models.ForeignKey(PlayerGameProfile,on_delete=models.CASCADE,related_name='+')
    state=models.CharField(max_length=20,default='pending')
    class Meta:constraints=[models.UniqueConstraint(fields=['sender','recipient'],name='unique_friend_request')]
class Friendship(models.Model):
    a=models.ForeignKey(PlayerGameProfile,on_delete=models.CASCADE,related_name='+')
    b=models.ForeignKey(PlayerGameProfile,on_delete=models.CASCADE,related_name='+')
    class Meta:constraints=[models.UniqueConstraint(fields=['a','b'],name='unique_friendship')]
class UserBlock(models.Model):
    owner=models.ForeignKey(PlayerGameProfile,on_delete=models.CASCADE,related_name='+')
    target=models.ForeignKey(PlayerGameProfile,on_delete=models.CASCADE,related_name='+')
    class Meta:constraints=[models.UniqueConstraint(fields=['owner','target'],name='unique_user_block')]
class Invitation(models.Model):
    id=models.UUIDField(primary_key=True,default=uuid.uuid4,editable=False)
    house=models.ForeignKey(PlayerHouse,on_delete=models.CASCADE)
    sender=models.ForeignKey(PlayerGameProfile,on_delete=models.CASCADE,related_name='+')
    recipient=models.ForeignKey(PlayerGameProfile,on_delete=models.CASCADE,related_name='+')
    state=models.CharField(max_length=20,default='pending')
    expires=models.DateTimeField()
class HouseVisitor(models.Model):
    id=models.UUIDField(primary_key=True,default=uuid.uuid4,editable=False)
    house=models.ForeignKey(PlayerHouse,on_delete=models.CASCADE)
    player=models.ForeignKey(PlayerGameProfile,on_delete=models.CASCADE)
    zone=models.CharField(max_length=12,default='interior')
    channel=models.CharField(max_length=200,unique=True)
    updated=models.DateTimeField(auto_now=True)
class GuestbookEntry(models.Model):
    id=models.UUIDField(primary_key=True,default=uuid.uuid4,editable=False)
    house=models.ForeignKey(PlayerHouse,on_delete=models.CASCADE)
    author=models.ForeignKey(PlayerGameProfile,on_delete=models.CASCADE)
    text=models.CharField(max_length=280)
    created=models.DateTimeField(auto_now_add=True)
class SocialMessage(models.Model):
    zone=models.CharField(max_length=12,default='interior')
    sender=models.ForeignKey(PlayerGameProfile,on_delete=models.CASCADE,related_name='+')
    recipient=models.ForeignKey(PlayerGameProfile,on_delete=models.CASCADE,null=True,related_name='+')
    house=models.ForeignKey(PlayerHouse,on_delete=models.CASCADE,null=True)
    text=models.CharField(max_length=280)
    created=models.DateTimeField(auto_now_add=True)
class PlayerGift(models.Model):
    id=models.UUIDField(primary_key=True,default=uuid.uuid4,editable=False)
    sender=models.ForeignKey(PlayerGameProfile,on_delete=models.CASCADE,related_name='+')
    recipient=models.ForeignKey(PlayerGameProfile,on_delete=models.CASCADE,related_name='+')
    item=models.CharField(max_length=100)
    created=models.DateTimeField(auto_now_add=True)
class GamePhoto(models.Model):
    id=models.UUIDField(primary_key=True,default=uuid.uuid4,editable=False)
    owner=models.ForeignKey(PlayerGameProfile,on_delete=models.CASCADE)
    image=models.TextField()
    caption=models.CharField(max_length=100)
    created=models.DateTimeField(auto_now_add=True)
class ActionReceipt(models.Model):
    owner=models.ForeignKey(PlayerGameProfile,on_delete=models.CASCADE)
    key=models.CharField(max_length=80)
    result=models.JSONField(default=dict)
    created=models.DateTimeField(auto_now_add=True)
    class Meta:constraints=[models.UniqueConstraint(fields=['owner','key'],name='unique_game_receipt')]
class AbuseReport(models.Model):
    author=models.ForeignKey(PlayerGameProfile,on_delete=models.CASCADE,related_name='+')
    target=models.ForeignKey(PlayerGameProfile,on_delete=models.CASCADE,related_name='+')
    reason=models.CharField(max_length=500)
    created=models.DateTimeField(auto_now_add=True)

class WorldInteraction(models.Model):
    """Action receipt and short lease; durable effects live on the house."""
    house=models.ForeignKey(PlayerHouse,on_delete=models.CASCADE)
    player=models.ForeignKey(PlayerGameProfile,on_delete=models.CASCADE)
    action_id=models.CharField(max_length=80)
    zone=models.CharField(max_length=12)
    target=models.CharField(max_length=80)
    slot=models.CharField(max_length=80,blank=True)
    action=models.CharField(max_length=32)
    phase=models.CharField(max_length=16,default='perform')
    expires=models.DateTimeField()
    payload=models.JSONField(default=dict)
    class Meta:
        constraints=[models.UniqueConstraint(fields=['player','action_id'],name='unique_world_action')]
        indexes=[models.Index(fields=['house','zone','target','expires'],name='world_action_lease')]

class AnimalCareQuest(models.Model):
    pet=models.ForeignKey(PetGameProfile,on_delete=models.CASCADE)
    owner=models.ForeignKey(PlayerGameProfile,on_delete=models.CASCADE)
    kind=models.CharField(max_length=12)
    cycle=models.PositiveIntegerField(default=1)
    state=models.CharField(max_length=12,default='active')
    reward=models.PositiveIntegerField(default=5)
    created=models.DateTimeField(auto_now_add=True)
    completed=models.DateTimeField(null=True)
    class Meta:constraints=[models.UniqueConstraint(fields=['pet','kind','cycle'],name='unique_pet_need_cycle')]

class PlayerCharacter(models.Model):
    id=models.CharField(primary_key=True,max_length=40)
    owner=models.ForeignKey(PlayerGameProfile,on_delete=models.CASCADE,related_name='characters')
    name=models.CharField(max_length=64)
    appearance=models.JSONField(default=dict)
    revision=models.PositiveIntegerField(default=1)
    created=models.DateTimeField(auto_now_add=True)
    updated=models.DateTimeField(auto_now=True)

class PlayerCatAppearance(models.Model):
    id=models.CharField(primary_key=True,max_length=40)
    owner=models.ForeignKey(PlayerGameProfile,on_delete=models.CASCADE,related_name='cat_appearances')
    name=models.CharField(max_length=64)
    appearance=models.JSONField(default=dict)
    thumbnail=models.TextField(blank=True)
    revision=models.PositiveIntegerField(default=1)
    created=models.DateTimeField(auto_now_add=True)
    updated=models.DateTimeField(auto_now=True)

class FurnitureBuild(models.Model):
    id=models.UUIDField(primary_key=True,default=uuid.uuid4,editable=False)
    player=models.ForeignKey(PlayerGameProfile,on_delete=models.CASCADE)
    item=models.CharField(max_length=80)
    mode=models.CharField(max_length=12)
    cost=models.PositiveIntegerField(default=0)
    materials=models.JSONField(default=list)
    created=models.DateTimeField(auto_now_add=True)
    ready_at=models.DateTimeField()
    claimed_at=models.DateTimeField(null=True,blank=True)
