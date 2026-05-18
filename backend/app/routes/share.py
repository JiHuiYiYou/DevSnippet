import json
import uuid
from datetime import datetime, timedelta

import bcrypt
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import ShareLink, init_db
from ..schemas import ShareCreateRequest, ShareResponse
from ..config import BASE_URL

router = APIRouter(prefix="/api/share", tags=["share"])


def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))


@router.post("", response_model=ShareResponse)
def create_share(req: ShareCreateRequest, db: Session = Depends(get_db)):
    init_db()

    token = str(uuid.uuid4())

    expires_at = None
    if req.expires_in_hours:
        expires_at = datetime.utcnow() + timedelta(hours=req.expires_in_hours)

    password_hash = None
    if req.password:
        password_hash = get_password_hash(req.password)

    entity_data_str = json.dumps(req.entity_data, ensure_ascii=False, default=str)

    link = ShareLink(
        token=token,
        entity_type=req.entity_type,
        entity_data=entity_data_str,
        password_hash=password_hash,
        readonly=1 if req.readonly else 0,
        expires_at=expires_at,
    )
    db.add(link)
    db.commit()
    db.refresh(link)

    return ShareResponse(
        token=token,
        url=f"{BASE_URL}/share/{token}",
        created_at=link.created_at.isoformat() if link.created_at else "",
        expires_at=link.expires_at.isoformat() if link.expires_at else None,
        readonly=bool(link.readonly),
    )


@router.get("/{token}")
def get_share(token: str, password: str | None = None, db: Session = Depends(get_db)):
    init_db()

    link = db.query(ShareLink).filter(ShareLink.token == token).first()
    if not link:
        raise HTTPException(status_code=404, detail="Share link not found")

    if link.expires_at and link.expires_at < datetime.utcnow():
        raise HTTPException(status_code=410, detail="Share link has expired")

    if link.password_hash:
        if not password:
            raise HTTPException(status_code=401, detail="Password required")
        if not verify_password(password, link.password_hash):
            raise HTTPException(status_code=401, detail="Invalid password")

    try:
        entity_data = json.loads(link.entity_data)
    except json.JSONDecodeError:
        entity_data = link.entity_data

    return {
        "token": token,
        "entity_type": link.entity_type,
        "entity_data": entity_data,
        "created_at": link.created_at.isoformat() if link.created_at else None,
        "password_protected": bool(link.password_hash),
        "readonly": bool(link.readonly),
    }
