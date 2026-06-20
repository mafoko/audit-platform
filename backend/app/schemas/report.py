from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from app.models.report import ReportStatus


class ReportCreate(BaseModel):
    title: str
    executive_summary: Optional[str] = None
    methodology: Optional[str] = None
    scope_description: Optional[str] = None


class ReportUpdate(BaseModel):
    title: Optional[str] = None
    executive_summary: Optional[str] = None
    methodology: Optional[str] = None
    scope_description: Optional[str] = None
    status: Optional[ReportStatus] = None


class AttestationCreate(BaseModel):
    role: str
    signature_note: Optional[str] = None


class AttestationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    report_id: int
    attested_by_id: int
    role: str
    attested_at: datetime
    signature_note: Optional[str]


class ReportOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    engagement_id: int
    title: str
    executive_summary: Optional[str]
    methodology: Optional[str]
    scope_description: Optional[str]
    status: ReportStatus
    generated_at: Optional[datetime]
    file_path: Optional[str]
    version: int
    attestations: List[AttestationOut] = []
