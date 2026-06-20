import enum
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON, Boolean, Enum as SAEnum
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class RiskRating(str, enum.Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    INFORMATIONAL = "INFORMATIONAL"


class FindingStatus(str, enum.Enum):
    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    CLOSED = "CLOSED"
    ACCEPTED_RISK = "ACCEPTED_RISK"


class Finding(Base):
    __tablename__ = "findings"
    id = Column(Integer, primary_key=True, index=True)
    engagement_id = Column(Integer, ForeignKey("engagements.id"), nullable=False)
    control_id = Column(Integer, ForeignKey("controls.id"), nullable=True)
    evidence_request_id = Column(Integer, ForeignKey("evidence_requests.id"), nullable=True)
    finding_ref = Column(String, nullable=False)  # e.g. "F-001"
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    root_cause = Column(Text, nullable=True)
    recommendation = Column(Text, nullable=True)
    risk_rating = Column(SAEnum(RiskRating), nullable=False)
    custom_rating = Column(String, nullable=True)
    management_response = Column(Text, nullable=True)
    management_response_date = Column(DateTime, nullable=True)
    status = Column(SAEnum(FindingStatus), default=FindingStatus.OPEN)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    engagement = relationship("Engagement", back_populates="findings")
    control = relationship("Control", back_populates="findings")
    evidence_request = relationship("EvidenceRequest", back_populates="findings")
    created_by = relationship("User", back_populates="findings_created")


class RiskMatrix(Base):
    __tablename__ = "risk_matrices"
    id = Column(Integer, primary_key=True, index=True)
    engagement_id = Column(Integer, ForeignKey("engagements.id"), nullable=False)
    name = Column(String, nullable=False)
    levels = Column(JSON, nullable=False)  # list of {label, color, score}
    is_default = Column(Boolean, default=False)

    engagement = relationship("Engagement", back_populates="risk_matrices")
