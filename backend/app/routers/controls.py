from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.control import Control, ControlAssignment
from app.models.engagement import Engagement, Standard
from app.schemas.control import ControlCreate, ControlOut, ControlAssignmentCreate, ControlAssignmentOut
from app.utils.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/engagements/{engagement_id}/controls", tags=["controls"])


@router.post("", response_model=ControlOut, status_code=status.HTTP_201_CREATED)
def create_control(engagement_id: int, data: ControlCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    engagement = db.query(Engagement).filter(Engagement.id == engagement_id).first()
    if not engagement:
        raise HTTPException(status_code=404, detail="Engagement not found")
    control = Control(engagement_id=engagement_id, **data.model_dump())
    db.add(control)
    db.commit()
    db.refresh(control)
    return control


@router.get("", response_model=List[ControlOut])
def list_controls(engagement_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Control).filter(Control.engagement_id == engagement_id).all()


@router.get("/{control_id}", response_model=ControlOut)
def get_control(engagement_id: int, control_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    control = db.query(Control).filter(Control.id == control_id, Control.engagement_id == engagement_id).first()
    if not control:
        raise HTTPException(status_code=404, detail="Control not found")
    return control


@router.put("/{control_id}", response_model=ControlOut)
def update_control(engagement_id: int, control_id: int, data: ControlCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    control = db.query(Control).filter(Control.id == control_id, Control.engagement_id == engagement_id).first()
    if not control:
        raise HTTPException(status_code=404, detail="Control not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(control, field, value)
    db.commit()
    db.refresh(control)
    return control


@router.delete("/{control_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_control(engagement_id: int, control_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    control = db.query(Control).filter(Control.id == control_id, Control.engagement_id == engagement_id).first()
    if not control:
        raise HTTPException(status_code=404, detail="Control not found")
    db.delete(control)
    db.commit()


@router.post("/generate", response_model=List[ControlOut], status_code=status.HTTP_201_CREATED)
def generate_controls_from_standards(engagement_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Generate stub controls from attached standards."""
    engagement = db.query(Engagement).filter(Engagement.id == engagement_id).first()
    if not engagement:
        raise HTTPException(status_code=404, detail="Engagement not found")
    standards = db.query(Standard).filter(Standard.engagement_id == engagement_id).all()
    if not standards:
        raise HTTPException(status_code=400, detail="No standards attached to this engagement")

    existing_count = db.query(Control).filter(Control.engagement_id == engagement_id).count()
    created_controls = []
    for i, std in enumerate(standards):
        control_ref = f"CTL-{existing_count + i + 1:03d}"
        control = Control(
            engagement_id=engagement_id,
            control_ref=control_ref,
            title=f"Control derived from {std.name}",
            description=f"This control was generated from the standard: {std.name}. Review and customize as needed.",
            standard_id=std.id,
            category=std.type,
        )
        db.add(control)
        created_controls.append(control)
    db.commit()
    for c in created_controls:
        db.refresh(c)
    return created_controls


@router.post("/{control_id}/assign", response_model=ControlAssignmentOut, status_code=status.HTTP_201_CREATED)
def assign_control(engagement_id: int, control_id: int, data: ControlAssignmentCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    control = db.query(Control).filter(Control.id == control_id, Control.engagement_id == engagement_id).first()
    if not control:
        raise HTTPException(status_code=404, detail="Control not found")
    assignment = ControlAssignment(control_id=control_id, **data.model_dump())
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return assignment
