import enum
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, Float, Enum as SAEnum
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class EvidenceStatus(str, enum.Enum):
    PENDING = "PENDING"
    SUBMITTED = "SUBMITTED"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    OVERDUE = "OVERDUE"


class FileReviewStatus(str, enum.Enum):
    PENDING = "PENDING"
    COMPLIANT = "COMPLIANT"
    NON_COMPLIANT = "NON_COMPLIANT"
    PARTIAL = "PARTIAL"


class EvidenceRequest(Base):
    __tablename__ = "evidence_requests"
    id = Column(Integer, primary_key=True, index=True)
    engagement_id = Column(Integer, ForeignKey("engagements.id"), nullable=False)
    control_id = Column(Integer, ForeignKey("controls.id"), nullable=True)
    request_ref = Column(String, nullable=False)  # e.g. "PBC-001"
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    requested_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    requested_at = Column(DateTime, default=datetime.utcnow)
    deadline_working_hours = Column(Integer, default=48)
    due_at = Column(DateTime, nullable=True)
    submitted_at = Column(DateTime, nullable=True)
    status = Column(SAEnum(EvidenceStatus), default=EvidenceStatus.PENDING)
    is_delayed = Column(Boolean, default=False)
    delay_hours = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)

    engagement = relationship("Engagement", back_populates="evidence_requests")
    control = relationship("Control", back_populates="evidence_requests")
    requested_by = relationship("User", back_populates="evidence_requests_made", foreign_keys=[requested_by_id])
    files = relationship("EvidenceFile", back_populates="evidence_request", cascade="all, delete-orphan")
    findings = relationship("Finding", back_populates="evidence_request")


class EvidenceFile(Base):
    __tablename__ = "evidence_files"
    id = Column(Integer, primary_key=True, index=True)
    evidence_request_id = Column(Integer, ForeignKey("evidence_requests.id"), nullable=False)
    uploaded_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    file_name = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_size = Column(Integer, nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    review_status = Column(SAEnum(FileReviewStatus), default=FileReviewStatus.PENDING)
    reviewer_notes = Column(Text, nullable=True)

    evidence_request = relationship("EvidenceRequest", back_populates="files")
    uploaded_by = relationship("User", back_populates="evidence_files")
