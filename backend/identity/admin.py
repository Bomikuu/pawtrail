from django.contrib import admin
from django.core.exceptions import ValidationError
from django import forms
from .models import Policy, Reference, Decision, AnalysisRun, CalibrationReport
from .locking import lock_gallery

class PolicyForm(forms.ModelForm):
    class Meta:
        model = Policy
        fields = "__all__"
    def clean(self):
        data = super().clean()
        if data.get("enabled"):
            if not data.get("evaluation_report", "").strip() or not data.get("model_version"):
                raise ValidationError("An evaluated model version and documented calibration report are required.")
            if not 0 < data.get("minimum_similarity", 0) <= 1 or not 0 < data.get("minimum_margin", 0) <= 2:
                raise ValidationError("Use calibrated similarity and competitor-margin thresholds.")
            if data.get("minimum_references", 0) < 3 or data.get("minimum_viewpoints", 0) < 2:
                raise ValidationError("Automatic identification needs at least three references across two viewpoints.")
        return data

@admin.register(Policy)
class PolicyAdmin(admin.ModelAdmin):
    form = PolicyForm
    list_display = ["version", "species", "model_version", "enabled"]
    readonly_fields = ["approved_by"]
    def has_add_permission(self, request): return False
    def has_change_permission(self, request, obj=None): return False
    def has_delete_permission(self, request, obj=None): return False
    def save_model(self, request, obj, form, change):
        lock_gallery()
        obj.approved_by = request.user
        super().save_model(request, obj, form, change)

@admin.register(Decision)
class DecisionAdmin(admin.ModelAdmin):
    list_display = ["observation", "method", "action", "created_at"]
    def has_add_permission(self, request): return False
    def has_change_permission(self, request, obj=None): return False
    def has_delete_permission(self, request, obj=None): return False

@admin.register(AnalysisRun)
class AnalysisAdmin(DecisionAdmin):
    list_display = ["id", "status", "stage", "created_at"]

@admin.register(CalibrationReport)
class CalibrationAdmin(DecisionAdmin):
    list_display = ["species", "model_version", "passed", "coverage", "created_at"]
