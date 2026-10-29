import os
import uuid
from pathlib import Path

from fastapi import APIRouter, UploadFile, File, HTTPException

from ..config import BASE_URL

router = APIRouter(prefix="/api", tags=["upload"])

# Runtime upload directory, outside the frontend build output
UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent.parent / "data" / "images"
ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".bmp", ".ico"}
MAX_SIZE_MB = 10


@router.post("/upload-image")
async def upload_image(file: UploadFile = File(...)):
    # Validate extension
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    # Validate size
    contents = await file.read()
    size_mb = len(contents) / (1024 * 1024)
    if size_mb > MAX_SIZE_MB:
        raise HTTPException(
            status_code=400,
            detail=f"File too large ({size_mb:.1f}MB). Maximum: {MAX_SIZE_MB}MB",
        )

    # Generate unique filename
    unique_name = f"{uuid.uuid4().hex}{ext}"
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    dest = UPLOAD_DIR / unique_name

    with open(dest, "wb") as f:
        f.write(contents)

    # Return the public URL info
    path = f"/images/{unique_name}"
    url = f"{BASE_URL}{path}"
    return {
        "ok": True,
        "url": url,
        "path": path,
        "filename": unique_name,
        "size_mb": round(size_mb, 2),
    }
