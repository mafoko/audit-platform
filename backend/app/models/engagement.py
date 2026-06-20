import enum
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class EngagementStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    ACTIVE = "ACTIVE"
    EVIDENCE_COLLECTION = "EVIDENCE_COLLECTION"
    REVIEW = "REVIEW"
    COMPLETED = "COMPLETED"
    CLOSED = "CLOSED"


class StandardType(str, enum.Enum):
    POLICY = "POLICY"
    INTERNATIONAL_STANDARD = "INTERNATIONAL_STANDARD"
    LOCAL_ACT = "LOCAL_ACT"
    INTERNATIONAL_LAW = "INTERNATIONAL_LAW"
    CUSTOM = "CUSTOM"


class Engagement(Base):
    __tablename__ = "engagements"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    client_name = Column(String, nullable=False)
    client_org_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    lead_auditor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(SAEnum(EngagementStatus), default=EngagementStatus.DRAFT)
    scope = Column(Text, nullable=True)
    objectives = Column(Text, nullable=True)
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    lead_auditor = relationship("User", back_populates="led_engagements", foreign_keys=[lead_auditor_id])
    client_org = relationship("User", foreign_keys=[client_org_id])
    standards = relationship("Standard", back_populates="engagement", cascade="all, delete-orphan")
    controls = relationship("Control", back_populates="engagement", cascade="all, delete-orphan")
    evidence_requests = relationship("EvidenceRequest", back_populates="engagement", cascade="all, delete-orphan")
    findings = relationship("Finding", back_populates="engagement", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="engagement", cascade="all, delete-orphan")
    risk_matrices = relationship("RiskMatrix", back_populates="engagement", cascade="all, delete-orphan")


class Standard(Base):
    __tablename__ = "standards"
    id = Column(Integer, primary_key=True, index=True)
    engagement_id = Column(Integer, ForeignKey("engagements.id"), nullable=False)
    name = Column(String, nullable=False)
    type = Column(SAEnum(StandardType), nullable=False)
    content = Column(Text, nullable=True)
    file_path = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    engagement = relationship("Engagement", back_populates="standards")
    controls = relationship("Control", back_populates="standard")
