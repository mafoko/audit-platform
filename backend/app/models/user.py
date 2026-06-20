import enum
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum as SAEnum
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    LEAD_AUDITOR = "LEAD_AUDITOR"
    AUDITOR = "AUDITOR"
    AUDITEE = "AUDITEE"


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(SAEnum(UserRole), nullable=False, default=UserRole.AUDITOR)
    firm_name = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # relationships
    led_engagements = relationship("Engagement", back_populates="lead_auditor", foreign_keys="Engagement.lead_auditor_id")
    control_assignments = relationship("ControlAssignment", back_populates="assigned_to")
    evidence_requests_made = relationship("EvidenceRequest", back_populates="requested_by", foreign_keys="EvidenceRequest.requested_by_id")
    evidence_files = relationship("EvidenceFile", back_populates="uploaded_by")
    findings_created = relationship("Finding", back_populates="created_by")
    attestations = relationship("ReportAttestation", back_populates="attested_by")
