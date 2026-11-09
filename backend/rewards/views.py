from rest_framework.decorators import api_view
from rest_framework.response import Response
from observations.pagination import page
from observations.views import limited
from .models import LedgerEntry
from .service import wallet_dto

@api_view(["GET"])
def wallet(request):
    return Response(wallet_dto(request.user))

@api_view(["GET"])
def ledger(request):
    rows = LedgerEntry.objects.filter(owner=request.user).select_related("grant", "mission_participation")
    def render(row):
        return {"id": str(row.pk), "userId": str(request.user.pk), "amount": row.amount, "balanceAfter": row.balance_after,
                "reason": row.reason, "contributionId": str(row.grant.observation_id) if row.grant_id else str(row.mission_participation_id or row.achievement_claim_id), "description": row.description,
                "animalName": row.animal_name_snapshot, "animalId": str(row.animal_id_snapshot) if row.animal_id_snapshot else None,
                "rewardDay": row.reward_day.isoformat() if row.reward_day else None, "createdAt": row.created_at,
                "provenance": {"kind": "real", "label": "Authoritative Kibble ledger"}}
    return Response(page(rows, request, render, limited(request)))
