from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import Response
from sqlalchemy.orm import Session
from typing import List, Optional
import os, shutil
from app.database import get_db
from app.models.engagement import Engagement, Standard, EngagementStatus
from app.models.control import Control
from app.models.evidence import EvidenceRequest
from app.schemas.engagement import EngagementCreate, EngagementUpdate, EngagementOut, StandardCreate, StandardOut
from app.utils.auth import get_current_user
from app.models.user import User
from app.services.document_gen import doc_generator
from app.config import settings

router = APIRouter(prefix="/engagements", tags=["engagements"])


@router.post("", response_model=EngagementOut, status_code=status.HTTP_201_CREATED)
def create_engagement(data: EngagementCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    engagement = Engagement(
        **data.model_dump(),
        lead_auditor_id=current_user.id,
    )
    db.add(engagement)
    db.commit()
    db.refresh(engagement)
    return engagement


@router.get("", response_model=List[EngagementOut])
def list_engagements(status_filter: Optional[str] = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(Engagement)
    if status_filter:
        query = query.filter(Engagement.status == status_filter)
    return query.all()


@router.get("/{engagement_id}", response_model=EngagementOut)
def get_engagement(engagement_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    engagement = db.query(Engagement).filter(Engagement.id == engagement_id).first()
    if not engagement:
        raise HTTPException(status_code=404, detail="Engagement not found")
    return engagement


@router.put("/{engagement_id}", response_model=EngagementOut)
def update_engagement(engagement_id: int, data: EngagementUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    engagement = db.query(Engagement).filter(Engagement.id == engagement_id).first()
    if not engagement:
        raise HTTPException(status_code=404, detail="Engagement not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(engagement, field, value)
    db.commit()
    db.refresh(engagement)
    return engagement


@router.delete("/{engagement_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_engagement(engagement_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    engagement = db.query(Engagement).filter(Engagement.id == engagement_id).first()
    if not engagement:
        raise HTTPException(status_code=404, detail="Engagement not found")
    db.delete(engagement)
    db.commit()


@router.post("/{engagement_id}/standards", response_model=StandardOut, status_code=status.HTTP_201_CREATED)
def attach_standard(engagement_id: int, data: StandardCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    engagement = db.query(Engagement).filter(Engagement.id == engagement_id).first()
    if not engagement:
        raise HTTPException(status_code=404, detail="Engagement not found")
    standard = Standard(engagement_id=engagement_id, **data.model_dump())
    db.add(standard)
    db.commit()
    db.refresh(standard)
    return standard


@router.post("/{engagement_id}/standards/{standard_id}/upload", response_model=StandardOut)
def upload_standard_file(engagement_id: int, standard_id: int, file: UploadFile = File(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    standard = db.query(Standard).filter(Standard.id == standard_id, Standard.engagement_id == engagement_id).first()
    if not standard:
        raise HTTPException(status_code=404, detail="Standard not found")
    upload_dir = os.path.join(settings.UPLOAD_DIR, "standards", str(engagement_id))
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, file.filename)
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    standard.file_path = file_path
    db.commit()
    db.refresh(standard)
    return standard


@router.patch("/{engagement_id}/status", response_model=EngagementOut)
def update_status(engagement_id: int, new_status: EngagementStatus, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    engagement = db.query(Engagement).filter(Engagement.id == engagement_id).first()
    if not engagement:
        raise HTTPException(status_code=404, detail="Engagement not found")
    engagement.status = new_status
    db.commit()
    db.refresh(engagement)
    return engagement


@router.post("/{engagement_id}/initiation-document")
def generate_initiation_doc(engagement_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    engagement = db.query(Engagement).filter(Engagement.id == engagement_id).first()
    if not engagement:
        raise HTTPException(status_code=404, detail="Engagement not found")
    controls = db.query(Control).filter(Control.engagement_id == engagement_id).all()
    evidence_requests = db.query(EvidenceRequest).filter(EvidenceRequest.engagement_id == engagement_id).all()
    doc_bytes = doc_generator.generate_initiation_document(engagement, controls, evidence_requests)
    filename = f"initiation_{engagement_id}.docx"
    return Response(
        content=doc_bytes,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
