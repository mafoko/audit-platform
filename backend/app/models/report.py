import enum
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class ReportStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    IN_REVIEW = "IN_REVIEW"
    FINAL = "FINAL"


class Report(Base):
    __tablename__ = "reports"
    id = Column(Integer, primary_key=True, index=True)
    engagement_id = Column(Integer, ForeignKey("engagements.id"), nullable=False)
    title = Column(String, nullable=False)
    executive_summary = Column(Text, nullable=True)
    methodology = Column(Text, nullable=True)
    scope_description = Column(Text, nullable=True)
    status = Column(SAEnum(ReportStatus), default=ReportStatus.DRAFT)
    generated_at = Column(DateTime, nullable=True)
    file_path = Column(String, nullable=True)
    version = Column(Integer, default=1)

    engagement = relationship("Engagement", back_populates="reports")
    attestations = relationship("ReportAttestation", back_populates="report", cascade="all, delete-orphan")


class ReportAttestation(Base):
    __tablename__ = "report_attestations"
    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("reports.id"), nullable=False)
    attested_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role = Column(String, nullable=False)
    attested_at = Column(DateTime, default=datetime.utcnow)
    signature_note = Column(Text, nullable=True)

    report = relationship("Report", back_populates="attestations")
    attested_by = relationship("User", back_populates="attestations")
