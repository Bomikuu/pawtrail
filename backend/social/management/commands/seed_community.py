"""Development records in the actual database; no identity evidence or reward grants."""
import os,secrets,uuid
from datetime import timedelta
from pathlib import Path
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.management.base import BaseCommand,CommandError
from django.db import transaction
from django.utils import timezone
from animals.models import Animal
from media.models import Asset
from media.service import upload, publish
from social.models import *

PREFIX='pawtrail:community:v1:'
def uid(key):return uuid.uuid5(uuid.NAMESPACE_URL,PREFIX+key)

def record(model,key,**defaults):
    row,_=model.all_objects.get_or_create(seed_key=PREFIX+key,defaults={'id':uid(key),'is_fixture':True,**defaults})
    return row

def illustration(owner,key,relative):
    provenance=PREFIX+'illustration:'+key
    asset=Asset.objects.filter(owner=owner,purpose='public_image',exif_evidence__seedKey=provenance).first()
    if asset:return asset
    path=Path(settings.BASE_DIR).parent/'public'/relative
    if not path.is_file():return None
    asset=upload(owner,SimpleUploadedFile(path.name,path.read_bytes(),content_type='image/webp'),'Community animal-care illustration')
    asset.purpose='public_image'
    asset.exif_evidence={**asset.exif_evidence,'seedKey':provenance,'generated':True,'usage':'Community illustration; not identification evidence'}
    asset.save(update_fields=['purpose','exif_evidence'])
    publish(asset)
    return asset

class Command(BaseCommand):
    help='Populate linked development records in Django. Safe to rerun; preserves edits and real records.'
    def add_arguments(self,parser):
        parser.add_argument('--refresh-dates',action='store_true',help='Move fixture event/mission dates forward without resetting edits.')
    @transaction.atomic
    def handle(self,*args,**options):
        if not settings.DEBUG:raise CommandError('Fixture population is available only in local development.')
        User=get_user_model();now=timezone.now();access=[]
        operators=[]
        for name,username,email,superuser in [('PawTrail Manager','pawtrail-manager','manager@pawtrail.local',True),('Care Reviewer','pawtrail-reviewer','reviewer@pawtrail.local',False)]:
            user=User.objects.filter(username=username).first()
            if user is None:
                password=secrets.token_urlsafe(24)
                user=User(username=username,email=email,display_name=name,is_staff=True,is_superuser=superuser)
                user.set_password(password);user.save();access.append((email,password))
            elif not user.is_staff:raise CommandError('An existing non-staff account uses the operator username; no privileges or passwords were changed.')
            UserProfile.objects.get_or_create(user=user)
            operators.append(user)
        manager,reviewer=operators
        areas=[]
        for i,(slug,name,lat,lng) in enumerate([('poblacion','Poblacion, Davao City',7.0731,125.6128),('buhangin','Buhangin, Davao City',7.105,125.6228),('matina','Matina, Davao City',7.0549,125.5886)]):
            areas.append(record(Area,'area:'+slug,slug=slug,name=name,latitude=lat,longitude=lng,radius=1500))
        def loc(i,offset=0):
            a=areas[i%len(areas)]
            return {'areaId':a.slug,'neighborhood':a.name,'latitude':round(a.latitude+(offset%5-2)*.0008,5),'longitude':round(a.longitude+(offset//5-1)*.0008,5),'approximateRadiusMeters':1500}
        people=[]
        for i,(username,name) in enumerate([('maya','Maya Santos'),('lina','Lina Cruz'),('jo','Jo Reyes'),('kai','Kai Ramos'),('anika','Anika Lim'),('marco','Marco Tan'),('bea','Bea Flores'),('nico','Nico Torres'),('ella','Ella Navarro'),('rafa','Rafa Garcia'),('isla','Isla Mendoza'),('theo','Theo Diaz')]):
            p=UserProfile.objects.filter(seed_key=PREFIX+'person:'+username).select_related('user').first()
            if p:user=p.user
            else:
                chosen=username if not User.objects.filter(username=username).exists() else username+'-neighbor'
                if User.objects.filter(username=chosen).exists():raise CommandError('A fixture username conflicts with an existing account; no account was overwritten.')
                user=User(id=uid('person:'+username),username=chosen,email=chosen+'@example.invalid',display_name=name)
                user.set_unusable_password();user.save()
                p=user.social_profile;p.is_fixture=True;p.seed_key=PREFIX+'person:'+username;p.avatar_id='pawtrail-avatar-'+str(i+1).zfill(2);p.bio=['Helping animals, one small act at a time.','Community cats, quiet walks, and practical kindness.','Sharing the work that makes a neighborhood kinder.'][i%3];p.area=areas[i%3];p.show_location=True;p.public_attendance=True;p.save()
            people.append(user)
        art=[asset for asset in [
            illustration(people[0],'friends','images/pawtrail/community-friends.webp'),
            illustration(people[0],'care-circle','images/pawtrail/care-circle.webp'),
        ] if asset]
        shelters=[]
        for i,(name,slug) in enumerate([('Sampaguita Animal Haven','sampaguita-animal-haven'),('Buhangin Care House','buhangin-care-house'),('Matina Rescue Garden','matina-rescue-garden')]):
            row=record(Shelter,'shelter:'+slug,slug=slug,name=name,description=['A small care space for animals preparing for their next chapter. Volunteers coordinate feeding, transport and introductions.','A neighborhood care circle focused on safe recovery, everyday routines and thoughtful adoption.','A garden shelter where cats and dogs can rest while caregivers coordinate their needs.'][i],location=loc(i),owner=people[i],published=True)
            row.staff.add(people[i],people[(i+3)%12],manager,reviewer);shelters.append(row)
            if art and not row.photo_id:row.photo=art[i%len(art)];row.save(update_fields=['photo'])
        hordes=[]
        for i,(name,slug) in enumerate([('Sampaguita Garden Cats','sampaguita-garden-cats'),('Buhangin Creek Companions','buhangin-creek-companions'),('Matina Market Paws','matina-market-paws')]):
            row=record(Horde,'horde:'+slug,slug=slug,name=name,description='A neighborhood animal group with a shared care routine, feeding spots and a circle of helpers.',location=loc(i,1),owner=people[i],published=True)
            row.contributors.add(people[i],people[(i+4)%12],manager);hordes.append(row)
            if art and not row.photo_id:row.photo=art[i%len(art)];row.save(update_fields=['photo'])
        animals=[]
        specs=[('Smokey','cat','Gray fur, pale chest and amber eyes',24,'male','small'),('Sunny','cat','Orange tabby with a cream muzzle and striped tail',18,'male','small'),('Luna','cat','Black coat with a small white chest patch',30,'female','small'),('Mochi','cat','White coat and pink ears',12,'female','small'),('Coco','cat','Calico patches in orange, black and white',20,'female','small'),('Miso','cat','Cream Siamese coat with darker face and ears',28,'male','small'),('Pepper','cat','Solid black fur and bright green eyes',36,'female','small'),('Cloud','cat','Soft gray fur with a white chin',14,'male','small'),('Ginger','cat','Warm ginger tabby fur and cream paws',10,'female','small'),('Milo','dog','Brown Aspin coat with a white chest',24,'male','medium'),('Biscuit','dog','Cream fur with warm brown ears',8,'male','small'),('Oreo','dog','White fur with black spots and dark ears',16,'female','medium'),('Chai','dog','Chocolate brown fur with a pale muzzle',42,'male','large'),('Snow','dog','White puppy with a pink nose',6,'female','small'),('Rusty','dog','Reddish brown coat and a curled tail',30,'male','medium'),('Poppy','dog','Black coat with a white chin and chest',20,'female','medium'),('Tala','cat','White coat with a gray ear patch',16,'female','small'),('Kopi','dog','Black and tan Aspin coat',32,'male','medium')]
        for i,(name,species,coat,age,gender,size) in enumerate(specs):
            key='animal:'+name.lower();identifier=uid(key);a=Animal.objects.filter(pk=identifier).first()
            if not a:
                slug=name.lower() if not Animal.objects.filter(slug=name.lower()).exists() else name.lower()+'-'+identifier.hex[:8]
                a=Animal.objects.create(id=identifier,owner=people[i%12],name=name,slug=slug,species=species,description=name+' enjoys a predictable routine, gentle company and a comfortable place to rest. Caregivers are gathering updates and coordinating next steps.',appearance=coat,area_label=areas[i%3].name,state='listed')
            info=record(AnimalInfo,'info:'+name.lower(),animal=a,caretaker=people[i%12],shelter=shelters[i%3] if i<12 else None,horde=hordes[i%3] if i>=12 else None,age_months=age,gender=gender,size=size,status='sheltered' if i<12 else 'community',adoptable=i<12,location=loc(i,i),personality=['Gentle','Curious'] if i%2 else ['Quiet','Affectionate'],behavior=['Enjoys a calm introduction','Responds to a regular care routine'],characteristics=[coat],needs={'suitableHomeTypes':['house','apartment'] if size!='large' else ['house','farm'],'energy':'low' if age>24 else 'medium','requiresExperiencedHandler':False,'compatiblePetTypes':[species]},observed_condition='Care notes are maintained by the shelter team.',published=True)
            animals.append(info)
        missions=[]
        tasks=[('Refresh the garden feeding station','food','Bring food, wash the bowls and leave the feeding area tidy.'),('Drive a companion to a clinic visit','transport','Coordinate with the care team before arranging a safe clinic trip.'),('Set up a shaded resting corner','shelter','Prepare a dry, shaded resting area and check that water is available.'),('Photograph an adoption profile','photos','Capture clear, respectful portraits and share the originals with the care team.'),('Restock everyday care supplies','supplies','Coordinate a care supply list and help sort the delivered items.'),('Join the evening water round','water','Refill clean water bowls and record any maintenance needs.'),('Prepare a foster welcome kit','foster','Pack bedding, food and the care notes requested by the shelter.'),('Help organize the care shelf','organize','Sort supplies and clearly separate food, cleaning materials and medical items.'),('Make an adoption introduction space','adoption','Help prepare a quiet place for supervised introductions.')]
        for i,(title,kind,description) in enumerate(tasks):
            row=record(Mission,'mission:'+kind,slug=kind+'-care-mission',title=title,description=description,organizer=people[i%3],animal=animals[i].animal,shelter=shelters[i%3],horde=None,kind='quest' if i%3==0 else 'mission',urgency='high' if i%4==0 else 'normal',deadline=now+timedelta(days=5+i),reward_kibble=0,location=loc(i,i),evidence_requirements=['A short account of what you did','A clear photo of the completed task'])
            if options['refresh_dates']:row.deadline=now+timedelta(days=5+i);row.save(update_fields=['deadline'])
            missions.append(row)
            record(MissionParticipation,'participation:'+kind,mission=row,volunteer=people[(i+4)%12],state='accepted')
        campaigns=[]
        for i,(title,slug,category,goal) in enumerate([('Keep the care bowls full','care-bowls','food',1500000),('A quiet recovery corner','recovery-corner','medical',2500000),('Safe rides to care','safe-rides','rescue',1800000),('Fresh bedding for new arrivals','fresh-bedding','shelter',1200000),('The neighborhood water round','water-round','community',800000),('Everyday care essentials','care-essentials','medical',2200000)]):
            row=record(Campaign,'campaign:'+slug,slug=slug,title=title,story='Help the care team plan '+title.lower()+'. The campaign keeps its budget, updates and recorded expenses together. Support can be pledged while the team coordinates the next steps.',category=category,urgency='normal',state='active',organizer=people[i%3],shelter=shelters[i%3],animal=animals[i].animal,location=loc(i,i),goal_minor=goal,budget=[{'description':'Care supplies and transport','amountMinor':goal}],timeline='Coordinate needs with the care team before arranging support.')
            campaigns.append(row)
            if art and not row.photos.exists():row.photos.add(art[i%len(art)])
            record(CampaignUpdate,'campaign-update:'+slug,campaign=row,author=people[i%3],text='The care team is putting the supply list together. Follow this page for the next update.')
            for j in range(2):record(SupportPledge,'pledge:'+slug+':'+str(j),campaign=row,supporter=people[(i+j+4)%12],amount_minor=10000*(j+1),message=['Happy to help coordinate supplies.','Please keep me posted on the care round.'][j],anonymous=j==1,status='pledged')
        events=[]
        for i,(title,slug) in enumerate([('Morning care circle','morning-care-circle'),('Meet the shelter team','meet-the-shelter-team'),('Adoption introduction afternoon','adoption-introductions'),('Garden feeding-kit workshop','feeding-kit-workshop'),('Neighborhood kindness walk','kindness-walk'),('Care shelf organization day','care-shelf-day')]):
            start=(now+timedelta(days=7+i*2)).replace(hour=1,minute=0,second=0,microsecond=0)
            row=record(Event,'event:'+slug,slug=slug,title=title,description='A small gathering to share care routines, meet neighbors and coordinate practical support for animals. Check with the host for venue confirmation before traveling.',organizer=people[i%3],shelter=shelters[i%3],starts_at=start,ends_at=start+timedelta(hours=3),venue={'name':'Community gathering space','address':areas[i%3].name+' · venue confirmation pending','latitude':loc(i,i)['latitude'],'longitude':loc(i,i)['longitude'],'intentionallyPublic':True},capacity=20+i*5,state='scheduled')
            if options['refresh_dates']:row.starts_at=start;row.ends_at=start+timedelta(hours=3);row.save(update_fields=['starts_at','ends_at'])
            events.append(row)
            for j in range(3):record(EventRsvp,'rsvp:'+slug+':'+str(j),event=row,attendee=people[(i+j+4)%12],public=True)
        for i,info in enumerate(animals[:12]):
            text=[info.animal.name+' is settling into a gentle routine. We are keeping care notes together so the next helper can pick up where the last one left off.', 'Putting together a care kit for '+info.animal.name+'. A clean bowl, fresh bedding and a quiet corner make a good start.', 'Today’s care plan for '+info.animal.name+': a calm introduction, regular meals and time to explore at their own pace.'][i%3]
            post=record(Post,'post:'+str(i),author=people[i%12],text=text,kind='story',refs=[{'kind':'animal','id':str(info.animal_id)},{'kind':'shelter','id':str(shelters[i%3].pk)}],moderation='published')
            if art and not post.photos.exists():post.photos.add(art[i%len(art)])
            for j in range(2):record(Comment,'comment:'+str(i)+':'+str(j),author=people[(i+j+3)%12],ref_kind='post',ref_id=post.pk,text=['Thanks for keeping the care notes together.','I can help coordinate the next care round.'][j])
            for j in range(3):record(Reaction,'reaction:'+str(i)+':'+str(j),post=post,user=people[(i+j+2)%12])
        for i,info in enumerate(animals[:4]):
            applicant=people[(i+5)%12]
            record(AdoptionApplication,'application:'+str(i),animal=info.animal,shelter=info.shelter,applicant=applicant,status='submitted',answers={'fullName':applicant.display_name,'email':applicant.email,'phone':'Not provided','livingSituation':'A quiet home with a secure indoor space.','careExperience':'Prepared a care plan and would like guidance from the shelter.','motivation':'Looking for a companion and ready to discuss a responsible introduction.','agreement':True},history=[{'status':'submitted','message':'Application awaiting shelter review.','actorId':str(applicant.pk),'createdAt':now.isoformat(),'version':1}])
        # Give the existing local operators useful personal and organization views.
        # These generated relationships retain fixture provenance and award nothing.
        for i,user in enumerate(operators):
            for j in range(3):
                info=animals[i*3+j]
                record(Saved,'operator-saved:'+str(i)+':animal:'+str(j),user=user,kind='animal',target_id=info.animal_id)
                record(Follow,'operator-follow:'+str(i)+':animal:'+str(j),user=user,kind='animal',target_id=info.animal_id)
                record(Follow,'operator-follow:'+str(i)+':person:'+str(j),user=user,kind='user',target_id=people[j].pk)
            for j in range(2):
                mission=missions[i*2+j]
                record(MissionParticipation,'operator-participation:'+str(i)+':'+str(j),mission=mission,volunteer=user,state='accepted')
                event=events[i*2+j]
                record(EventRsvp,'operator-rsvp:'+str(i)+':'+str(j),event=event,attendee=user,public=False)
                campaign=campaigns[i*2+j]
                record(Saved,'operator-saved:'+str(i)+':campaign:'+str(j),user=user,kind='fundraiser',target_id=campaign.pk)
            for kind,message,ref in [
                ('mission','The community care board has new tasks to coordinate.',{'kind':'mission','id':str(missions[i].pk)}),
                ('event','Upcoming community gatherings are ready to browse.',{'kind':'event','id':str(events[i].pk)}),
                ('application','There are adoption applications in your shelter workspace.',{'kind':'shelter','id':str(shelters[i].pk)}),
            ]:record(Notification,'operator-notification:'+str(i)+':'+kind,recipient=user,kind=kind,message=message,ref=ref)
        if access:
            path=settings.DATA_DIR/'local-operator-access.txt'
            fd=os.open(path,os.O_WRONLY|os.O_CREAT|os.O_APPEND,0o600)
            with os.fdopen(fd,'a') as output:
                output.write('\nLocal development operator access — keep private\n')
                for email,password in access:output.write(email+'\n'+password+'\n\n')
            self.stdout.write('Created local operator access in '+str(path)+'. Existing passwords were preserved.')
        self.stdout.write(self.style.SUCCESS('Database populated: 12 members, 3 shelters, 3 Hordes, 18 animals, 9 missions, 6 fundraisers, 12 pledges, 6 events, 22 RSVPs, 12 illustrated stories, 24 comments, 36 reactions and 4 adoption applications; local operator saved items, follows, missions and notifications are included.'))
        self.stdout.write('No identity references, verified sightings, collected payments or Kibble awards were seeded.')
