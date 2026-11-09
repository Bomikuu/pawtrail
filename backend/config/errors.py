from django.db import IntegrityError
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework.response import Response
from rest_framework.exceptions import APIException
from rest_framework.views import exception_handler as drf_handler

class DomainError(APIException):
    def __init__(self, message, code="VALIDATION_ERROR", status=400):
        self.status_code = status
        self.default_code = code
        super().__init__(message, code)

def exception_handler(exc, context):
    if isinstance(exc, IntegrityError):
        return Response({"code":"CONFLICT","message":"A related record changed or this operation already exists. Reload before retrying.","status":409},status=409,headers={"Cache-Control":"no-store"})
    if isinstance(exc, DjangoValidationError):
        return Response({"code":"VALIDATION_ERROR","message":"Choose valid record identifiers and field values.","status":400},status=400,headers={"Cache-Control":"no-store"})
    response = drf_handler(exc, context)
    if response is None:
        return None
    data = response.data
    detail = data.get("detail") if isinstance(data, dict) else None
    message = str(detail) if detail else "Please correct the highlighted fields."
    code = getattr(exc, "default_code", "REQUEST_FAILED")
    if response.status_code == 401:
        code = "UNAUTHENTICATED"
    elif response.status_code == 404:
        code = "NOT_FOUND"
    response.data = {"code": code, "message": message, "status": response.status_code}
    if not detail and isinstance(data, dict):
        response.data["fieldErrors"] = {key: value if isinstance(value, list) else [str(value)] for key, value in data.items()}
    response["Cache-Control"] = "no-store"
    return response
