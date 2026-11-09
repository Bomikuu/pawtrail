from django.contrib import admin
from .models import LedgerEntry, Wallet, EncounterGrant

class ReadOnlyAdmin(admin.ModelAdmin):
    def has_add_permission(self, request): return False
    def has_change_permission(self, request, obj=None): return False
    def has_delete_permission(self, request, obj=None): return False

@admin.register(LedgerEntry)
class LedgerAdmin(ReadOnlyAdmin):
    list_display = ["owner", "amount", "reason", "animal_name_snapshot", "created_at"]

@admin.register(Wallet)
class WalletAdmin(ReadOnlyAdmin):
    list_display = ["owner", "balance", "updated_at"]

@admin.register(EncounterGrant)
class GrantAdmin(ReadOnlyAdmin):
    list_display = ["owner", "observation", "status", "credited", "reward_day"]
