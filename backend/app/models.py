import uuid
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, create_engine
from sqlalchemy.orm import declarative_base
from .database import engine

Base = declarative_base()


class ShareLink(Base):
    __tablename__ = "share_links"

    id = Column(Integer, primary_key=True, autoincrement=True)
    token = Column(String(36), unique=True, nullable=False, default=lambda: str(uuid.uuid4()))
    entity_type = Column(String(10), nullable=False)
    entity_data = Column(Text, nullable=False)
    password_hash = Column(String(256), nullable=True)
    readonly = Column(Integer, default=0, nullable=False)
    expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


def init_db():
    Base.metadata.create_all(bind=engine)
