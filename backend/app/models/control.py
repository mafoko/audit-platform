from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class Control(Base):
    __tablename__ = "controls"
    id = Column(Integer, primary_key=True, index=True)
    engagement_id = Column(Integer, ForeignKey("engagements.id"), nullable=False)
    control_ref = Column(String, nullable=False)  # e.g. "CTL-001"
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    standard_id = Column(Integer, ForeignKey("standards.id"), nullable=True)
    category = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    engagement = relationship("Engagement", back_populates="controls")
    standard = relationship("Standard", back_populates="controls")
    assignments = relationship("ControlAssignment", back_populates="control", cascade="all, delete-orphan")
    evidence_requests = relationship("EvidenceRequest", back_populates="control")
    findings = relationship("Finding", back_populates="control")


class ControlAssignment(Base):
    __tablename__ = "control_assignments"
    id = Column(Integer, primary_key=True, index=True)
    control_id = Column(Integer, ForeignKey("controls.id"), nullable=False)
    assigned_to_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    due_date = Column(DateTime, nullable=True)

    control = relationship("Control", back_populates="assignments")
    assigned_to = relationship("User", back_populates="control_assignments")
