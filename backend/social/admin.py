from django.contrib import admin
from . import models
from django.db import transaction
from .achievements.changes import achievement_changes

class AchievementAwareAdmin(admin.ModelAdmin):
    def changeform_view(self, request, object_id=None, form_url='', extra_context=None):
        with transaction.atomic(), achievement_changes():
            return super().changeform_view(request, object_id, form_url, extra_context)
    def delete_view(self, request, object_id, extra_context=None):
        with transaction.atomic(), achievement_changes():
            return super().delete_view(request, object_id, extra_context)
    def delete_queryset(self, request, queryset):
        with transaction.atomic(), achievement_changes():
            return super().delete_queryset(request, queryset)

class InternalRecordAdmin(AchievementAwareAdmin):
    readonly_fields=('id','created_at','updated_at','version','is_fixture','seed_key')
    def get_readonly_fields(self,request,obj=None):
        fields={f.name for f in self.model._meta.fields}
        return self.readonly_fields+tuple(f for f in ['state','verified','reward_kibble','published'] if f in fields)
    def get_queryset(self,request):return self.model.all_objects.all()
    list_per_page=30
    def get_list_display(self,request):
        available={f.name for f in self.model._meta.fields}
        return tuple(f for f in ['id','name','title','status','state','is_fixture','created_at'] if f in available)
    def get_list_filter(self,request):return ('is_fixture',)
class ReadOnlyRecordAdmin(InternalRecordAdmin):
    def get_readonly_fields(self,request,obj=None):return tuple(f.name for f in self.model._meta.fields)+tuple(f.name for f in self.model._meta.many_to_many)
    def has_add_permission(self,request):return False
    def has_delete_permission(self,request,obj=None):return False
for model in [models.Area,models.Shelter,models.Horde,models.AnimalInfo,models.Mission,models.Campaign,models.Event,models.Post]:admin.site.register(model,InternalRecordAdmin)
for model in [models.MissionParticipation,models.AdoptionApplication,models.CampaignUpdate,models.CampaignExpense,models.SupportPledge,models.FundReceipt,models.EventRsvp,models.Audit,models.ContentReport]:admin.site.register(model,ReadOnlyRecordAdmin)
@admin.register(models.UserProfile)
class ProfileAdmin(AchievementAwareAdmin):
    list_display=('user','is_fixture','discoverable')
    readonly_fields=('is_fixture','seed_key')

for model in [models.AchievementClaim, models.AchievementActivity, models.AchievementProof, models.AchievementShowcase]:
    admin.site.register(model, ReadOnlyRecordAdmin)
