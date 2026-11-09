"""Local ONNX inference. Models are installed explicitly, never fetched during a request."""
import hashlib
import json
from functools import lru_cache
from pathlib import Path
import numpy as np
from PIL import Image, ImageOps
from django.conf import settings

class ProviderUnavailable(Exception):
    pass

def installed_model_version():
    try:
        detector = json.loads((settings.MODEL_DIR / "detector" / "manifest.json").read_text())["revision"]
        embedding = json.loads((settings.MODEL_DIR / "embedding" / "manifest.json").read_text())["revision"]
        return "dinov2-small-" + embedding[:12] + "-detr-" + detector[:8]
    except (OSError, ValueError, KeyError):
        return None

@lru_cache(maxsize=2)
def session(name):
    import onnxruntime as ort
    folder = settings.MODEL_DIR / name
    try:
        manifest = json.loads((folder / "manifest.json").read_text())
        model = folder / "model_quantized.onnx"
        if hashlib.sha256(model.read_bytes()).hexdigest() != manifest["sha256"]:
            raise ProviderUnavailable("Model checksum does not match its installation manifest.")
        options = ort.SessionOptions()
        options.intra_op_num_threads = 2
        options.inter_op_num_threads = 1
        runtime = ort.InferenceSession(str(model), sess_options=options, providers=["CPUExecutionProvider"])
        return runtime, manifest, json.loads((folder / "config.json").read_text())
    except (OSError, KeyError, ValueError) as error:
        raise ProviderUnavailable("Local recognition models are not installed. Run the documented install_models command.") from error

def normalize(image):
    array = np.asarray(image, dtype=np.float32) / 255.0
    array = (array - np.array([0.485, 0.456, 0.406], dtype=np.float32)) / np.array([0.229, 0.224, 0.225], dtype=np.float32)
    return np.transpose(array, (2, 0, 1))[None].astype(np.float32)

def detect(image):
    runtime, manifest, config = session("detector")
    scale = min(800 / min(image.size), 1333 / max(image.size))
    size = tuple(max(1, round(v * scale)) for v in image.size)
    tensor = normalize(image.resize(size, Image.Resampling.BILINEAR))
    inputs = {"pixel_values": tensor}
    for field in runtime.get_inputs():
        if field.name == "pixel_mask":
            inputs[field.name] = np.ones((1, size[1], size[0]), dtype=np.int64)
    outputs = dict(zip([v.name for v in runtime.get_outputs()], runtime.run(None, inputs)))
    logits = outputs.get("logits")
    boxes = outputs.get("pred_boxes")
    if logits is None or boxes is None:
        raise ProviderUnavailable("The configured detector has an incompatible output format.")
    scores = np.exp(logits[0] - logits[0].max(axis=-1, keepdims=True))
    scores /= scores.sum(axis=-1, keepdims=True)
    detections = []
    for score, box in zip(scores, boxes[0]):
        label_id = int(score[:-1].argmax())
        label = config["id2label"].get(str(label_id), "")
        if label not in {"cat", "dog"} or float(score[label_id]) < 0.7:
            continue
        cx, cy, width, height = [float(v) for v in box]
        x, y = max(0, cx - width / 2), max(0, cy - height / 2)
        width, height = min(1 - x, width), min(1 - y, height)
        if not all(np.isfinite([x, y, width, height])) or min(width, height) < 0.01:
            continue
        detections.append({"id": str(len(detections)), "species": label, "score": round(float(score[label_id]), 4),
                           "crop": {"x": x, "y": y, "width": width, "height": height}})
    return detections, manifest["revision"]

def embed(image):
    runtime, manifest, _ = session("embedding")
    ratio = 256 / min(image.size)
    resized = image.resize(tuple(round(v * ratio) for v in image.size), Image.Resampling.BICUBIC)
    left, top = (resized.width - 224) // 2, (resized.height - 224) // 2
    fitted = resized.crop((left, top, left + 224, top + 224))
    output = dict(zip([v.name for v in runtime.get_outputs()], runtime.run(None, {"pixel_values": normalize(fitted)})))
    vector = output.get("pooler_output")
    if vector is None:
        hidden = output.get("last_hidden_state")
        if hidden is None:
            raise ProviderUnavailable("The configured embedding model has an incompatible output format.")
        vector = hidden[:, 0, :]
    vector = np.asarray(vector[0], dtype=np.float64)
    norm = float(np.linalg.norm(vector))
    if not norm or not np.isfinite(vector).all():
        raise ProviderUnavailable("The embedding model returned an invalid feature vector.")
    return (vector / norm).tolist(), "dinov2-small-" + manifest["revision"][:12]
