from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from app.models.evidence import EvidenceStatus, FileReviewStatus


class EvidenceRequestCreate(BaseModel):
    control_id: Optional[int] = None
    request_ref: str
    title: str
    description: Optional[str] = None
    deadline_working_hours: int = 48
    notes: Optional[str] = None


class EvidenceRequestUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    deadline_working_hours: Optional[int] = None
    notes: Optional[str] = None
    status: Optional[EvidenceStatus] = None


class EvidenceFileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    evidence_request_id: int
    uploaded_by_id: int
    file_name: str
    file_path: str
    file_size: Optional[int]
    uploaded_at: datetime
    review_status: FileReviewStatus
    reviewer_notes: Optional[str]


class EvidenceRequestOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    engagement_id: int
    control_id: Optional[int]
    request_ref: str
    title: str
    description: Optional[str]
    requested_by_id: int
    requested_at: datetime
    deadline_working_hours: int
    due_at: Optional[datetime]
    submitted_at: Optional[datetime]
    status: EvidenceStatus
    is_delayed: bool
    delay_hours: Optional[float]
    notes: Optional[str]
    files: List[EvidenceFileOut] = []


class FileReviewUpdate(BaseModel):
    review_status: FileReviewStatus
    reviewer_notes: Optional[str] = None
