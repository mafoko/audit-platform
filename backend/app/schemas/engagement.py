from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from app.models.engagement import EngagementStatus, StandardType


class StandardCreate(BaseModel):
    name: str
    type: StandardType
    content: Optional[str] = None


class StandardOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    engagement_id: int
    name: str
    type: StandardType
    content: Optional[str]
    file_path: Optional[str]
    created_at: datetime


class EngagementCreate(BaseModel):
    title: str
    client_name: str
    client_org_id: Optional[int] = None
    scope: Optional[str] = None
    objectives: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class EngagementUpdate(BaseModel):
    title: Optional[str] = None
    client_name: Optional[str] = None
    scope: Optional[str] = None
    objectives: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    status: Optional[EngagementStatus] = None


class EngagementOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    client_name: str
    client_org_id: Optional[int]
    lead_auditor_id: int
    status: EngagementStatus
    scope: Optional[str]
    objectives: Optional[str]
    start_date: Optional[datetime]
    end_date: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    standards: List[StandardOut] = []
