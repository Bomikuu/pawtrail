import hashlib
import io
import warnings
from PIL import Image, ImageOps, UnidentifiedImageError
from django.core.files.base import ContentFile
from config.errors import DomainError
from .models import Asset

MAX_BYTES = 10 * 1024 * 1024
Image.MAX_IMAGE_PIXELS = 24_000_000

def decoded(raw):
    try:
        with warnings.catch_warnings():
            warnings.simplefilter("error", Image.DecompressionBombWarning)
            original = Image.open(io.BytesIO(raw))
            if original.format not in {"JPEG", "PNG", "WEBP"} or getattr(original, "n_frames", 1) != 1:
                raise DomainError("Choose a still JPEG, PNG or WebP image. Convert HEIC before uploading.")
            original.load()
            if min(original.size) < 64:
                raise DomainError("This image is too small. Take a closer, clearer photo.")
            exif = original.getexif()
            metadata = {"dateTimeOriginal": str(exif.get(36867, "")), "dateTime": str(exif.get(306, ""))}
            try:
                gps = exif.get_ifd(34853)
                def coordinate(value, direction):
                    result = sum(float(v) / d for v, d in zip(value, [1, 60, 3600]))
                    return -result if direction in {"S", "W"} else result
                if gps.get(2) and gps.get(4):
                    metadata["location"] = {"latitude": coordinate(gps[2], gps.get(1)), "longitude": coordinate(gps[4], gps.get(3))}
            except (ValueError, TypeError, KeyError, ZeroDivisionError):
                pass
            image = ImageOps.exif_transpose(original).convert("RGB")
            image.thumbnail((2048, 2048))
            clean = Image.new("RGB", image.size)
            clean.paste(image)
            return clean, metadata
    except (UnidentifiedImageError, OSError, ValueError, Image.DecompressionBombError, Image.DecompressionBombWarning):
        raise DomainError("This image could not be decoded safely. Try another JPEG, PNG or WebP photo.")

def dhash(image):
    values = list(image.convert("L").resize((9, 8)).getdata())
    bits = sum((values[y * 9 + x] > values[y * 9 + x + 1]) << (y * 8 + x) for y in range(8) for x in range(8))
    return format(bits, "016x")

def upload(actor, file, alt):
    if not file or file.size > MAX_BYTES or not file.size:
        raise DomainError("Choose a photo up to 10 MiB.")
    raw = file.read(MAX_BYTES + 1)
    if len(raw) > MAX_BYTES:
        raise DomainError("Choose a photo up to 10 MiB.")
    image, metadata = decoded(raw)
    output = io.BytesIO()
    image.save(output, "JPEG", quality=90)
    asset = Asset(owner=actor, alt=alt[:500] or "Animal encounter photo", sha256=hashlib.sha256(raw).hexdigest(), pixel_digest=hashlib.sha256(image.tobytes()).hexdigest(),
                  perceptual_hash=dhash(image), width=image.width, height=image.height, byte_count=len(raw), exif_evidence=metadata)
    asset.original.save(str(asset.pk) + ".original", ContentFile(raw), save=False)
    asset.normalized.save(str(asset.pk) + ".jpg", ContentFile(output.getvalue()), save=False)
    try:
        asset.save()
    except Exception:
        asset.original.delete(save=False)
        asset.normalized.delete(save=False)
        raise
    return asset

def publish(asset):
    if asset.purpose == "private_evidence" or asset.mime_type == "application/pdf" or asset.sensitive:
        raise DomainError("Private or sensitive evidence cannot be published.")
    if not asset.derivative:
        with asset.normalized.open("rb") as stream:
            image = Image.open(stream).convert("RGB")
            clean = Image.new("RGB", image.size)
            clean.paste(image)
            clean.thumbnail((1200, 1200))
            output = io.BytesIO()
            clean.save(output, "JPEG", quality=85)
        asset.derivative.save(str(asset.pk) + ".jpg", ContentFile(output.getvalue()), save=False)
    asset.public = True
    asset.save(update_fields=["public", "derivative"])

def asset_dto(asset):
    return {"id": str(asset.pk), "url": "/api/capture/media/" + str(asset.pk) + "/content", "alt": asset.alt,
            "visibility": "private", "mimeType": asset.mime_type, "bytes": asset.byte_count}

def public_image(asset):
    if not asset or not asset.public or not asset.derivative:
        return None
    return {"id": str(asset.pk), "url": "/api/capture/media/" + str(asset.pk) + "/public", "alt": asset.alt,
            "provenance": {"kind": "real", "label": "Community-contributed photograph"}}
