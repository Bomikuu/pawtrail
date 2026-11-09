from .models import Policy
from django.db import connection
from .calibration import policy_blockers

def assess_identity(run):
    """No calibrated policy means suggestions only; similarity is never a probability."""
    if run.status != "complete" or not run.candidates or run.evidence_flags or run.features.get("qualityReasons"):
        return None, "evidence_requires_review"
    policies = Policy.objects.filter(enabled=True, species=run.features.get("species"), model_version=run.model_version).select_related("calibration").order_by("-created_at")
    if connection.in_atomic_block:
        policies = policies.select_for_update(of=("self",))
    top = run.candidates[0]
    second = run.candidates[1]["similarity"] if len(run.candidates) > 1 else -1
    for policy in policies:
        if policy_blockers(policy) or top["animalId"] not in policy.calibration.cohort_ids:
            continue
        if not policy.evaluation_report.strip() or not 0 < policy.minimum_similarity <= 1 or not 0 < policy.minimum_margin <= 2:
            continue
        if top["similarity"] < policy.minimum_similarity or top["similarity"] - second < policy.minimum_margin:
            continue
        if top["referenceCount"] < max(3, policy.minimum_references) or len(top["viewpoints"]) < max(2, policy.minimum_viewpoints):
            continue
        if top["context"] != "near_recent_reports":
            continue
        return {"animalId": top["animalId"], "policyVersion": policy.version}, "policy_match"
    return None, "no_qualified_automatic_match"
