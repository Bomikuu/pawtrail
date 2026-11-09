"""Operational calibration/report validation. No fabricated evaluation data or default enabled policy."""
import hashlib
import json
import math
from collections import defaultdict
from django.db import transaction
from django.utils import timezone
from accounts.views import is_reviewer
from animals.models import Animal
from config.errors import DomainError
from .models import CalibrationReport, Policy, Reference
from .locking import lock_gallery
from .providers import installed_model_version
from .retrieval import gallery_fingerprint

RULE_VERSION = "visual-retrieval-v2"
MAX_WRONG_MATCH_RATE = 0.005
CONFIDENCE = 0.95

def wrong_match_upper_bound(errors, accepted, alpha=0.05):
    """One-sided exact binomial upper bound, computed without a SciPy dependency."""
    if accepted <= 0 or errors >= accepted:
        return 1.0
    if errors == 0:
        return 1 - alpha ** (1 / accepted)
    def cdf(probability):
        logs = [math.lgamma(accepted + 1) - math.lgamma(k + 1) - math.lgamma(accepted - k + 1)
                + k * math.log(probability) + (accepted - k) * math.log1p(-probability) for k in range(errors + 1)]
        maximum = max(logs)
        return math.exp(maximum) * sum(math.exp(value - maximum) for value in logs)
    low, high = errors / accepted, 1 - 1e-12
    for _ in range(70):
        middle = (low + high) / 2
        if cdf(middle) > alpha:
            low = middle
        else:
            high = middle
    return high

def integer(data, name, maximum=10_000):
    value = data.get(name)
    if isinstance(value, bool) or not isinstance(value, int) or not 0 <= value <= maximum:
        raise DomainError("Calibration field " + name + " must be a nonnegative integer.")
    return value

def validate_report(payload):
    if not isinstance(payload, dict) or payload.get("format") != "pawtrail-calibration-v1":
        raise DomainError("Use a PawTrail calibration report generated from labeled real encounters.")
    if payload.get("ruleVersion") != RULE_VERSION or not isinstance(payload.get("species"), str) or payload["species"] not in {"cat", "dog"}:
        raise DomainError("The calibration species or decision-rule version is unsupported.")
    if payload.get("modelVersion") != installed_model_version():
        raise DomainError("This report was not generated for the installed model version.")
    import re
    if not isinstance(payload.get("datasetDigest"), str) or not re.fullmatch(r"[a-f0-9]{64}", payload["datasetDigest"]):
        raise DomainError("The labeled dataset digest is required.")
    cohort = payload.get("knownAnimalIds")
    if not isinstance(cohort, list) or not 1 <= len(cohort) <= 1000 or any(not isinstance(value, str) for value in cohort) or len(set(cohort)) != len(cohort):
        raise DomainError("List distinct real animal IDs for this calibration cohort.")
    try:
        import uuid
        cohort = [str(uuid.UUID(value)) for value in cohort]
    except ValueError:
        raise DomainError("Calibration animal IDs must be valid UUIDs.")
    if Animal.objects.filter(pk__in=cohort, state="confirmed", species=payload["species"]).count() != len(cohort):
        raise DomainError("Every calibration identity must be a confirmed real animal of the selected species.")
    if payload.get("galleryFingerprint") != gallery_fingerprint(payload["species"], cohort):
        raise DomainError("The calibration reference gallery changed. Prepare a new report.", "STALE_CALIBRATION", 409)
    reference_counts, viewpoints = defaultdict(int), defaultdict(set)
    for animal_id, viewpoint in Reference.objects.filter(active=True, animal_id__in=cohort, model_version=payload["modelVersion"]).values_list("animal_id", "viewpoint"):
        reference_counts[str(animal_id)] += 1
        viewpoints[str(animal_id)].add(viewpoint)
    if any(reference_counts[value] < 3 or len(viewpoints[value]) < 2 for value in cohort):
        raise DomainError("Every calibrated animal needs three independently curated reference photos across two viewpoints.")
    thresholds = payload.get("thresholds", {})
    if not isinstance(thresholds, dict):
        raise DomainError("The report needs a thresholds object.")
    for name, maximum in [("minimumSimilarity", 1), ("minimumMargin", 2)]:
        value = thresholds.get(name)
        if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value) or not 0 < value <= maximum:
            raise DomainError("The report needs a valid calibrated " + name + ".")
    if payload.get("referenceMinimum") != 3 or payload.get("viewpointMinimum") != 2:
        raise DomainError("The report must evaluate the production reference/viewpoint gates.")
    if payload.get("sessionSeparated") is not True or payload.get("unknownIndividualsExcludedFromGallery") is not True:
        raise DomainError("Independent sessions and unknown individuals outside the gallery must be documented.")
    tuning, validation = payload.get("tuning", {}), payload.get("validation", {})
    if not isinstance(tuning, dict) or not isinstance(validation, dict):
        raise DomainError("The report needs tuning and validation metric objects.")
    tuning_queries = integer(tuning, "queries")
    queries = integer(validation, "queries")
    accepted = integer(validation, "accepted")
    errors = integer(validation, "wrongIdentities")
    unknown_queries = integer(validation, "unknownQueries")
    unknown_errors = integer(validation, "unknownFalseAccepts")
    unknown_individuals = integer(validation, "unknownIndividuals")
    if not tuning_queries or not queries or accepted > queries or errors > accepted or unknown_queries > queries or unknown_errors > min(unknown_queries, errors) or accepted - unknown_errors > queries - unknown_queries:
        raise DomainError("The report's evaluation counts are inconsistent.")
    if unknown_individuals > unknown_queries:
        raise DomainError("Unknown-individual counts exceed their query count.")
    bound = wrong_match_upper_bound(errors, accepted)
    coverage = accepted / queries
    reasons = []
    if bound > MAX_WRONG_MATCH_RATE:
        reasons.append("The 95% upper bound on wrong auto-matches exceeds 0.5%.")
    if unknown_queries < 20 or unknown_individuals < 2:
        reasons.append("Validation needs at least 20 unknown-animal queries across two or more unknown individuals.")
    if unknown_errors:
        reasons.append("Unknown animals were incorrectly accepted; this pilot policy remains disabled.")
    if coverage < 0.1:
        reasons.append("Automatic coverage is below the 10% pilot minimum.")
    return {"passed": not reasons, "reasons": reasons, "wrongMatchUpperBound": bound, "coverage": coverage, "knownAnimalIds": cohort}

@transaction.atomic
def import_report(actor, payload, notes):
    if not is_reviewer(actor):
        raise DomainError("A real identity reviewer account is required.", "FORBIDDEN", 403)
    if not isinstance(notes, str) or len(notes.strip()) < 10 or len(notes) > 3000:
        raise DomainError("Describe the report's source and the conditions it covers.")
    lock_gallery()
    result = validate_report(payload)
    digest = hashlib.sha256(json.dumps(payload, sort_keys=True, separators=(",", ":")).encode()).hexdigest()
    report, _ = CalibrationReport.objects.get_or_create(digest=digest, defaults={"created_by": actor, "species": payload["species"],
        "model_version": payload["modelVersion"], "rule_version": RULE_VERSION, "gallery_fingerprint": payload["galleryFingerprint"],
        "cohort_ids": result["knownAnimalIds"], "payload": payload, "passed": result["passed"],
        "wrong_match_upper_bound": result["wrongMatchUpperBound"], "coverage": result["coverage"], "notes": notes.strip()})
    policy, _ = Policy.objects.get_or_create(version="cal-" + digest[:20], defaults={"species": report.species,
        "model_version": report.model_version, "minimum_similarity": payload["thresholds"]["minimumSimilarity"],
        "minimum_margin": payload["thresholds"]["minimumMargin"], "minimum_references": 3, "minimum_viewpoints": 2,
        "evaluation_report": notes.strip(), "calibration": report, "approved_by": actor})
    return report, policy, result

def policy_blockers(policy):
    report = policy.calibration
    if not report:
        return ["Import a structured calibration report first."]
    if not report.passed:
        return ["This calibration report did not meet the pilot acceptance criteria."]
    if report.rule_version != RULE_VERSION or report.model_version != installed_model_version():
        return ["Installed models or decision rules changed since calibration."]
    if report.species != policy.species or report.model_version != policy.model_version:
        return ["Policy and calibration model/species do not match."]
    thresholds = report.payload["thresholds"]
    if policy.minimum_similarity != thresholds["minimumSimilarity"] or policy.minimum_margin != thresholds["minimumMargin"] or policy.minimum_references != 3 or policy.minimum_viewpoints != 2:
        return ["Policy settings differ from the evaluated settings."]
    if gallery_fingerprint(report.species, report.cohort_ids) != report.gallery_fingerprint:
        return ["References in the calibrated cohort changed; prepare a new report."]
    return []

@transaction.atomic
def set_policy_enabled(actor, policy_id, enabled):
    if not is_reviewer(actor):
        raise DomainError("A real identity reviewer account is required.", "FORBIDDEN", 403)
    lock_gallery()
    from django.shortcuts import get_object_or_404
    policy = get_object_or_404(Policy.objects.select_for_update(of=("self",)).select_related("calibration"), pk=policy_id)
    if enabled:
        blockers = policy_blockers(policy)
        if blockers:
            raise DomainError(" ".join(blockers), "CALIBRATION_NOT_READY", 409)
        Policy.objects.filter(species=policy.species, enabled=True).exclude(pk=policy.pk).update(enabled=False)
    policy.enabled = enabled
    policy.approved_by = actor
    policy.save(update_fields=["enabled", "approved_by"])
    return policy
