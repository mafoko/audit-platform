from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Any
from datetime import datetime
from app.models.finding import RiskRating, FindingStatus


class FindingCreate(BaseModel):
    control_id: Optional[int] = None
    evidence_request_id: Optional[int] = None
    finding_ref: str
    title: str
    description: Optional[str] = None
    root_cause: Optional[str] = None
    recommendation: Optional[str] = None
    risk_rating: RiskRating
    custom_rating: Optional[str] = None


class FindingUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    root_cause: Optional[str] = None
    recommendation: Optional[str] = None
    risk_rating: Optional[RiskRating] = None
    custom_rating: Optional[str] = None
    management_response: Optional[str] = None
    status: Optional[FindingStatus] = None


class FindingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    engagement_id: int
    control_id: Optional[int]
    evidence_request_id: Optional[int]
    finding_ref: str
    title: str
    description: Optional[str]
    root_cause: Optional[str]
    recommendation: Optional[str]
    risk_rating: RiskRating
    custom_rating: Optional[str]
    management_response: Optional[str]
    management_response_date: Optional[datetime]
    status: FindingStatus
    created_by_id: int
    created_at: datetime
    updated_at: datetime


class RiskMatrixCreate(BaseModel):
    name: str
    levels: List[Any]  # list of {label, color, score}
    is_default: bool = False


class RiskMatrixOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    engagement_id: int
    name: str
    levels: List[Any]
    is_default: bool
