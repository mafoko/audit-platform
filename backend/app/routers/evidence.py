from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import os, shutil
from datetime import datetime
from app.database import get_db
from app.models.evidence import EvidenceRequest, EvidenceFile, EvidenceStatus
from app.models.engagement import Engagement
from app.schemas.evidence import EvidenceRequestCreate, EvidenceRequestOut, EvidenceFileOut, EvidenceRequestUpdate, FileReviewUpdate
from app.utils.auth import get_current_user
from app.models.user import User
from app.services.deadline import calculator
from app.config import settings

router = APIRouter(tags=["evidence"])


@router.post("/engagements/{engagement_id}/evidence-requests", response_model=EvidenceRequestOut, status_code=status.HTTP_201_CREATED)
def create_evidence_request(engagement_id: int, data: EvidenceRequestCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    engagement = db.query(Engagement).filter(Engagement.id == engagement_id).first()
    if not engagement:
        raise HTTPException(status_code=404, detail="Engagement not found")
    requested_at = datetime.utcnow()
    due_at = calculator.calculate_due_date(requested_at, data.deadline_working_hours)
    er = EvidenceRequest(
        engagement_id=engagement_id,
        requested_by_id=current_user.id,
        requested_at=requested_at,
        due_at=due_at,
        **data.model_dump(),
    )
    db.add(er)
    db.commit()
    db.refresh(er)
    return er


@router.get("/engagements/{engagement_id}/evidence-requests", response_model=List[EvidenceRequestOut])
def list_evidence_requests(
    engagement_id: int,
    status_filter: Optional[EvidenceStatus] = Query(None),
    delayed_only: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # First update overdue
    calculator.get_overdue_requests(db)
    query = db.query(EvidenceRequest).filter(EvidenceRequest.engagement_id == engagement_id)
    if status_filter:
        query = query.filter(EvidenceRequest.status == status_filter)
    if delayed_only:
        query = query.filter(EvidenceRequest.is_delayed == True)
    return query.all()


@router.get("/evidence-requests/{request_id}", response_model=EvidenceRequestOut)
def get_evidence_request(request_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    er = db.query(EvidenceRequest).filter(EvidenceRequest.id == request_id).first()
    if not er:
        raise HTTPException(status_code=404, detail="Evidence request not found")
    return er


@router.put("/evidence-requests/{request_id}", response_model=EvidenceRequestOut)
def update_evidence_request(request_id: int, data: EvidenceRequestUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    er = db.query(EvidenceRequest).filter(EvidenceRequest.id == request_id).first()
    if not er:
        raise HTTPException(status_code=404, detail="Evidence request not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(er, field, value)
    db.commit()
    db.refresh(er)
    return er


@router.post("/evidence-requests/{request_id}/submit", response_model=EvidenceRequestOut)
def mark_submitted(request_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    er = db.query(EvidenceRequest).filter(EvidenceRequest.id == request_id).first()
    if not er:
        raise HTTPException(status_code=404, detail="Evidence request not found")
    submitted_at = datetime.utcnow()
    er.submitted_at = submitted_at
    er.status = EvidenceStatus.SUBMITTED
    if er.due_at:
        is_delayed, delay_hours = calculator.calculate_delay(er.due_at, submitted_at)
        er.is_delayed = is_delayed
        er.delay_hours = delay_hours
    db.commit()
    db.refresh(er)
    return er


@router.post("/evidence-requests/{request_id}/upload", response_model=EvidenceFileOut, status_code=status.HTTP_201_CREATED)
def upload_evidence_file(request_id: int, file: UploadFile = File(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    er = db.query(EvidenceRequest).filter(EvidenceRequest.id == request_id).first()
    if not er:
        raise HTTPException(status_code=404, detail="Evidence request not found")
    upload_dir = os.path.join(settings.UPLOAD_DIR, "evidence", str(request_id))
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, file.filename)
    file_size = 0
    with open(file_path, "wb") as f:
        content = file.file.read()
        file_size = len(content)
        f.write(content)
    ef = EvidenceFile(
        evidence_request_id=request_id,
        uploaded_by_id=current_user.id,
        file_name=file.filename,
        file_path=file_path,
        file_size=file_size,
    )
    db.add(ef)
    db.commit()
    db.refresh(ef)
    return ef


@router.patch("/evidence-files/{file_id}/review", response_model=EvidenceFileOut)
def review_evidence_file(file_id: int, data: FileReviewUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ef = db.query(EvidenceFile).filter(EvidenceFile.id == file_id).first()
    if not ef:
        raise HTTPException(status_code=404, detail="Evidence file not found")
    ef.review_status = data.review_status
    ef.reviewer_notes = data.reviewer_notes
    db.commit()
    db.refresh(ef)
    return ef
