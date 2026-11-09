import math
import numpy as np
from PIL import ImageFilter

def crop_image(image, crop):
    return image.crop((round(crop["x"] * image.width), round(crop["y"] * image.height),
                       round((crop["x"] + crop["width"]) * image.width),
                       round((crop["y"] + crop["height"]) * image.height)))

def overlap(a, b):
    right, bottom = min(a["x"] + a["width"], b["x"] + b["width"]), min(a["y"] + a["height"], b["y"] + b["height"])
    intersection = max(0, right - max(a["x"], b["x"])) * max(0, bottom - max(a["y"], b["y"]))
    return intersection / max(1e-8, a["width"] * a["height"] + b["width"] * b["height"] - intersection)

def describe(image):
    sample = np.asarray(image.resize((64, 64)), dtype=np.float32) / 255
    # The center-weighted histogram reduces background influence; it is not a segmentation mask.
    center = sample[12:52, 12:52]
    histogram, _ = np.histogramdd(center.reshape(-1, 3), bins=(4, 4, 4), range=((0, 1), (0, 1), (0, 1)))
    histogram = histogram.flatten()
    histogram /= max(1, histogram.sum())
    gray = np.asarray(image.convert("L").resize((128, 128)), dtype=np.float32)
    brightness = float(gray.mean())
    detail = float(np.abs(np.diff(gray, axis=0)).mean() + np.abs(np.diff(gray, axis=1)).mean())
    reasons = []
    if min(image.size) < 80:
        reasons.append("animal_too_small")
    if brightness < 28:
        reasons.append("photo_too_dark")
    if detail < 1.8:
        reasons.append("photo_lacks_detail")
    return {"histogram": histogram.tolist(), "brightness": brightness, "detail": detail, "qualityReasons": reasons}

def distance_meters(a_lat, a_lon, b_lat, b_lon):
    lat1, lat2 = math.radians(a_lat), math.radians(b_lat)
    delta_lat, delta_lon = lat2 - lat1, math.radians(b_lon - a_lon)
    value = math.sin(delta_lat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(delta_lon / 2) ** 2
    return 6371008.8 * 2 * math.asin(min(1, math.sqrt(max(0, value))))
