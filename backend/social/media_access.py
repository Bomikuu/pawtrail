from .models import Campaign,MissionParticipation,CampaignExpense,AnimalInfo,AnimalMedicalRecord,AnimalMedicalRevision
from .common import own,manages

def withdraw_unused_photos(assets):
    """Keep retained review files private once their final public use is withdrawn."""
    from .models import Post,AnimalInfo,Campaign,CampaignUpdate,Horde,Shelter
    from observations.models import Sighting
    for asset in {a.pk:a for a in assets if a and a.public}.values():
        used=(Post.objects.filter(photos=asset,moderation='published').exists()
              or AnimalInfo.objects.filter(animal__photo=asset,published=True).exists()
              or Campaign.objects.filter(photos=asset,state__in=['active','completed','closed']).exists()
              or CampaignUpdate.objects.filter(post__photos=asset,post__moderation='published',campaign__state__in=['active','completed','closed']).exists()
              or Shelter.objects.filter(photo=asset,published=True).exists()
              or Horde.objects.filter(photo=asset,published=True).exists()
              or Sighting.objects.filter(observation__capture__media=asset,active=True,observation__publication_state='published').exists())
        if not used:
            asset.public=False
            asset.save(update_fields=['public'])

def can_read(user,asset):
    if not user.is_authenticated:return False
    for record in AnimalMedicalRecord.objects.filter(attachments=asset).select_related('animal_info__shelter'):
        if record.animal_info.caretaker_id==user.pk or manages(user,record.animal_info.shelter):return True
    for revision in AnimalMedicalRevision.objects.filter(documents=asset).select_related('record__animal_info__shelter'):
        info=revision.record.animal_info
        if info.caretaker_id==user.pk or manages(user,info.shelter):return True
    for row in AnimalInfo.objects.filter(private_evidence=asset).select_related('shelter'):
        if row.caretaker_id==user.pk or manages(user,row.shelter):return True
    for row in Campaign.objects.filter(private_evidence=asset).select_related('shelter'):
        if own(user,row):return True
    for row in MissionParticipation.objects.filter(evidence_media=asset).select_related('mission__shelter'):
        if own(user,row.mission):return True
    for row in CampaignExpense.objects.filter(receipts=asset).select_related('campaign__shelter'):
        if own(user,row.campaign):return True
    return False
