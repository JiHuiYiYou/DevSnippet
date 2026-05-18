from pydantic import BaseModel
from typing import Optional


class ShareCreateRequest(BaseModel):
    entity_type: str
    entity_data: dict | str
    password: Optional[str] = None
    expires_in_hours: Optional[int] = None
    readonly: bool = False


class ShareResponse(BaseModel):
    token: str
    url: str
    created_at: str
    expires_at: Optional[str] = None
    readonly: bool = False


class ShareAccessRequest(BaseModel):
    password: Optional[str] = None
