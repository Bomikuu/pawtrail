import hashlib
from django.core import signing
from django.db.models import Q
from django.utils.dateparse import parse_datetime
from config.errors import DomainError

def page(query, request, render, limit, time_field="created_at"):
    scope = hashlib.sha256((request.path + ":" + str(request.user.pk) + ":" + request.query_params.get("scope", "") + ":" + request.query_params.get("q", "")).encode()).hexdigest()
    count = query.count()
    cursor = request.query_params.get("cursor")
    if cursor:
        try:
            data = signing.loads(cursor, salt="capture-page", max_age=86400)
            if data["scope"] != scope:
                raise ValueError()
            timestamp = parse_datetime(data["time"])
            if not timestamp:
                raise ValueError()
            query = query.filter(Q(**{time_field+"__lt": timestamp}) | Q(**{time_field: timestamp, "pk__lt": data["id"]}))
        except (signing.BadSignature, KeyError, TypeError, ValueError):
            raise DomainError("This page cursor is invalid or expired. Reload the list.", "INVALID_CURSOR")
    rows = list(query.order_by("-"+time_field, "-pk")[:limit + 1])
    more = len(rows) > limit
    rows = rows[:limit]
    next_cursor = signing.dumps({"scope": scope, "time": getattr(rows[-1], time_field).isoformat(), "id": str(rows[-1].pk)}, salt="capture-page") if more else None
    return {"items": [render(row) for row in rows], "count": count, "nextCursor": next_cursor}
