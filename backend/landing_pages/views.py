import json, re
from django.db import transaction
from django.db.models import Q
from django.http import HttpResponse, FileResponse
from django.shortcuts import get_object_or_404
from django.urls import resolve, Resolver404
from django.test import RequestFactory
from django.core.files.storage import default_storage
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from social.models import Shelter
from social.common import manager, manages
from config.errors import DomainError
from website_builder.models import Website, ReviewShare
from website_builder.services.revisions import save_draft
from website_builder.services.globals import public_document
from website_builder.validation import validate_document
from .models import LandingPage, LandingMedia
from .hooks import public_data

@api_view(['GET','POST'])
def workspace(request):
    rows=Shelter.objects.filter(Q(owner=request.user)|Q(staff=request.user)).distinct()
    if request.user.is_staff: rows=Shelter.objects.all()
    if request.method=='GET':
        return Response({'shelters':[{'id':str(s.pk),'slug':s.slug,'name':s.name,'description':s.description,'websiteId':str(s.landing_page.website_id) if hasattr(s,'landing_page') else None,'published':bool(s.landing_page.website.published_id) if hasattr(s,'landing_page') else False} for s in rows.select_related('landing_page__website').order_by('name')]})
    shelter=get_object_or_404(Shelter,pk=request.data.get('shelterId'));manager(request,shelter)
    template=request.data.get('template')
    if template not in {'story','adoption','community'}: raise DomainError('Choose an available landing template.')
    document=request.data.get('document');validate_document(document)
    with transaction.atomic():
        Shelter.objects.select_for_update().get(pk=shelter.pk)
        existing=LandingPage.objects.filter(shelter=shelter).first()
        if existing:return Response({'websiteId':str(existing.website_id)})
        website=Website.objects.create(tenant='pawtrail-shelter:'+str(shelter.pk),key='landing')
        website=save_draft(website.pk,document,0,request.user)
        LandingPage.objects.create(shelter=shelter,website=website,template=template)
    return Response({'websiteId':str(website.pk)},status=201)

@api_view(['GET'])
@permission_classes([AllowAny])
def published(request, slug):
    page=get_object_or_404(LandingPage.objects.select_related('shelter__photo','website__published'),shelter__slug=slug,shelter__published=True,website__published__isnull=False)
    document=public_document(page.website.tenant,page.website.published.document)
    data=public_data(page)
    # Only assets actually referenced by the published document are public.
    refs=set()
    def visit(n):
        props=n.get('props',{});refs.add(str(props.get('assetId','')));refs.update(str(x) for x in props.get('assetIds',[]))
        for c in n.get('children',[]):visit(c)
    visit(document);data['assets']={k:v for k,v in data['assets'].items() if k in refs}
    return Response({'name':page.shelter.name,'slug':slug,'document':document,'data':data})

@api_view(['GET','POST','PUT','DELETE'])
def builder(request, route):
    if len(route)>350 or not re.fullmatch(r'[A-Za-z0-9/-]+',route):raise DomainError('Invalid Studio route.')
    if route=='csrf/':return Response({})
    try:match=resolve('/'+route,urlconf='website_builder.urls')
    except Resolver404:raise DomainError('Studio route not found.','NOT_FOUND',404)
    website_id=match.kwargs.get('website_id')
    if not website_id:raise DomainError('This Studio operation is unavailable.','FORBIDDEN',403)
    page=get_object_or_404(LandingPage.objects.select_related('shelter'),website_id=website_id);manager(request,page.shelter)
    # Review links are intentionally unavailable until a dedicated PawTrail review route exists.
    if 'reviews' in route:raise DomainError('Use the private editor preview to review this page.')
    factory=RequestFactory()
    if request.content_type and request.content_type.startswith('multipart/'):
        raw=factory.post('/'+route,{**{k:v for k,v in request.data.items() if k!='file'},'file':request.FILES.get('file')})
    else:
        raw=factory.generic(request.method,'/'+route+('?' + request.META['QUERY_STRING'] if request.META.get('QUERY_STRING') else ''),json.dumps(request.data) if request.method!='GET' else '',content_type='application/json')
    raw.user=request.user
    return match.func(raw,**match.kwargs)

@api_view(['POST'])
def unpublish(request, website_id):
    page=get_object_or_404(LandingPage.objects.select_related('shelter'),website_id=website_id);manager(request,page.shelter)
    with transaction.atomic():
        site=Website.objects.select_for_update().get(pk=website_id)
        if request.data.get('expectedVersion')!=site.version:raise DomainError('The page changed. Reload before unpublishing.','CONFLICT',409)
        site.published=None;site.version+=1;site.save(update_fields=['published','version','updated_at'])
    return Response({'version':site.version})

@api_view(['GET'])
@permission_classes([AllowAny])
def media(request, media_id):
    row=get_object_or_404(LandingMedia.objects.select_related('page__shelter','page__website__published'),pk=media_id)
    allowed=manages(request.user,row.page.shelter)
    if not allowed and row.page.shelter.published and row.page.website.published_id:
        document=public_document(row.page.website.tenant,row.page.website.published.document)
        def used(n):
            props=n.get('props',{})
            return str(props.get('assetId',''))==str(row.pk) or str(row.pk) in props.get('assetIds',[]) or any(used(c) for c in n.get('children',[]))
        allowed=used(document)
    if not allowed:raise DomainError('Image not found.','NOT_FOUND',404)
    response=FileResponse(default_storage.open(row.name,'rb'),content_type='image/webp');response['Cache-Control']='private, no-store';response['X-Content-Type-Options']='nosniff';return response
