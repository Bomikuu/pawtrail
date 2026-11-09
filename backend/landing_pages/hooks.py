from django.core.exceptions import PermissionDenied
from website_builder.services.media import persist_image
from django.core.files.storage import default_storage
from social.common import manages, image
from .models import LandingPage, LandingMedia

def page_for(website):
    return LandingPage.objects.select_related('shelter').get(website=website)
def authorize(request, website, action):
    try: page = page_for(website)
    except LandingPage.DoesNotExist: return False
    return manages(request.user, page.shelter) and request.user.is_active

def assets(page):
    return {str(row.pk): {'url': '/api/landing-pages/media/'+str(row.pk), 'alt':row.alt, 'type':'image', 'width':row.metadata['width'], 'height':row.metadata['height']} for row in page.media.all()}
def resolve_data(request, website, review=False):
    page=page_for(website)
    if not authorize(request, website, 'edit'): raise PermissionDenied('Shelter management permission is required.')
    return public_data(page)
def public_data(page):
    shelter=page.shelter
    photo=image(shelter.photo)
    return {'identity':{'name':shelter.name,'description':shelter.description},'assets':{'hero':{'url':photo['url'] if photo else '/images/illustrations/pet-companions.webp','alt':shelter.name if photo else 'PawTrail animal companions illustration','type':'image'},**assets(page)}}
def capabilities(request, website):
    page=page_for(website)
    return {'features':[], 'dataSources':[], 'sources':[], 'workspace':{'version':1,'purpose':'landing','kind':'page','sourceId':str(page.shelter_id),'sourceName':page.shelter.name,'mediaUpload':True,'publicUrl':'/sites/'+page.shelter.slug,'pages':[]}}
def upload_media(request, website, prepared, alt):
    page=page_for(website)
    meta=persist_image(prepared,default_storage,'shelter-sites')
    row=LandingMedia.objects.create(page=page,name=meta['name'],alt=str(alt)[:300],metadata=meta)
    return {'id':str(row.pk),**assets(page)[str(row.pk)]}
