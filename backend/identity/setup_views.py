import json
from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import serializers
from rest_framework.decorators import api_view
from rest_framework.response import Response
from accounts.views import is_reviewer
from animals.models import Animal
from observations.models import Observation
from config.errors import DomainError
from media.service import public_image
from .models import CalibrationReport, Policy, Reference
from .providers import installed_model_version
from .calibration import RULE_VERSION, MAX_WRONG_MATCH_RATE, CONFIDENCE, import_report, policy_blockers, set_policy_enabled

def reviewer_required(actor):
    if not is_reviewer(actor):
        raise DomainError("Identification setup requires a real reviewer account.", "FORBIDDEN", 403)

def policy_dto(policy):
    blockers = policy_blockers(policy)
    report = policy.calibration
    return {"id": policy.pk, "version": policy.version, "species": policy.species, "enabled": policy.enabled,
            "effective": policy.enabled and not blockers, "blockers": blockers,
            "modelVersion": policy.model_version, "minimumSimilarity": policy.minimum_similarity,
            "minimumMargin": policy.minimum_margin, "calibrationId": str(report.pk) if report else None,
            "coverage": report.coverage if report else None, "wrongMatchUpperBound": report.wrong_match_upper_bound if report else None,
            "createdAt": policy.created_at}

@api_view(["GET"])
def setup(request):
    reviewer_required(request.user)
    model_version = installed_model_version()
    references = Reference.objects.filter(active=True, animal__state="confirmed", model_version=model_version).select_related("animal__photo")
    buckets = {}
    for reference in references:
        identity = str(reference.animal_id)
        bucket = buckets.setdefault(identity, {"animalId": identity, "name": reference.animal.name, "species": reference.animal.species,
            "photo": public_image(reference.animal.photo), "referenceCount": 0, "viewpoints": set()})
        bucket["referenceCount"] += 1
        bucket["viewpoints"].add(reference.viewpoint)
    cohort = []
    for value in buckets.values():
        value["viewpoints"] = sorted(value["viewpoints"])
        value["ready"] = value["referenceCount"] >= 3 and len(value["viewpoints"]) >= 2
        cohort.append(value)
    policies = [policy_dto(row) for row in Policy.objects.select_related("calibration").order_by("-enabled", "-created_at")[:50]]
    reviewed = Observation.objects.filter(publication_state="published", identity_state="confirmed", decisions__method="reviewer").distinct()
    return Response({"modelVersion": model_version, "ruleVersion": RULE_VERSION,
        "confirmedAnimals": Animal.objects.filter(state="confirmed").count(), "referencePhotos": references.count(),
        "qualifiedAnimals": sum(row["ready"] for row in cohort), "reviewedEncounters": reviewed.count(),
        "calibrationReports": CalibrationReport.objects.count(), "activePolicies": sum(row["effective"] for row in policies),
        "requirements": {"referencePhotosPerAnimal": 3, "viewpointsPerAnimal": 2, "maximumWrongMatchRate": MAX_WRONG_MATCH_RATE,
                         "confidence": CONFIDENCE, "minimumUnknownQueries": 20, "minimumUnknownIndividuals": 2},
        "animals": cohort, "policies": policies})

class ImportInput(serializers.Serializer):
    report = serializers.JSONField()
    notes = serializers.CharField(min_length=10, max_length=3000)
    acknowledgeRealData = serializers.BooleanField()

@api_view(["POST"])
def import_calibration(request):
    reviewer_required(request.user)
    data = ImportInput(data=request.data)
    data.is_valid(raise_exception=True)
    if not data.validated_data["acknowledgeRealData"]:
        raise DomainError("Confirm that this report uses independently labeled genuine encounters.")
    if len(json.dumps(data.validated_data["report"]).encode()) > 256 * 1024:
        raise DomainError("Choose a calibration report up to 256 KiB.")
    report, policy, result = import_report(request.user, data.validated_data["report"], data.validated_data["notes"])
    return Response({"reportId": str(report.pk), "passed": result["passed"], "reasons": result["reasons"], "policy": policy_dto(policy)}, status=201)

class ActivationInput(serializers.Serializer):
    enabled = serializers.BooleanField()

@api_view(["POST"])
def activate_policy(request, policy_id):
    reviewer_required(request.user)
    data = ActivationInput(data=request.data)
    data.is_valid(raise_exception=True)
    return Response(policy_dto(set_policy_enabled(request.user, policy_id, data.validated_data["enabled"])))
