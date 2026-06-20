from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime


class ControlCreate(BaseModel):
    control_ref: str
    title: str
    description: Optional[str] = None
    standard_id: Optional[int] = None
    category: Optional[str] = None


class ControlOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    engagement_id: int
    control_ref: str
    title: str
    description: Optional[str]
    standard_id: Optional[int]
    category: Optional[str]
    is_active: bool
    created_at: datetime


class ControlAssignmentCreate(BaseModel):
    assigned_to_id: int
    due_date: Optional[datetime] = None


class ControlAssignmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    control_id: int
    assigned_to_id: int
    due_date: Optional[datetime]
