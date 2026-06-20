from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import os
from app.database import get_db
from app.models.report import Report, ReportAttestation, ReportStatus
from app.models.finding import Finding
from app.models.engagement import Engagement
from app.schemas.report import ReportCreate, ReportUpdate, ReportOut, AttestationCreate, AttestationOut
from app.utils.auth import get_current_user
from app.models.user import User
from app.services.document_gen import doc_generator
from app.config import settings

router = APIRouter(tags=["reports"])


@router.post("/engagements/{engagement_id}/reports", response_model=ReportOut, status_code=status.HTTP_201_CREATED)
def create_report(engagement_id: int, data: ReportCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    engagement = db.query(Engagement).filter(Engagement.id == engagement_id).first()
    if not engagement:
        raise HTTPException(status_code=404, detail="Engagement not found")
    report = Report(engagement_id=engagement_id, **data.model_dump())
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


@router.get("/engagements/{engagement_id}/reports", response_model=List[ReportOut])
def list_reports(engagement_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Report).filter(Report.engagement_id == engagement_id).all()


@router.get("/reports/{report_id}", response_model=ReportOut)
def get_report(report_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report


@router.put("/reports/{report_id}", response_model=ReportOut)
def update_report(report_id: int, data: ReportUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(report, field, value)
    db.commit()
    db.refresh(report)
    return report


@router.post("/reports/{report_id}/generate")
def generate_report_document(report_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    findings = db.query(Finding).filter(Finding.engagement_id == report.engagement_id).all()
    attestations = db.query(ReportAttestation).filter(ReportAttestation.report_id == report_id).all()

    doc_bytes = doc_generator.generate_audit_report(report, findings, attestations)

    # Save to disk
    report_dir = os.path.join(settings.UPLOAD_DIR, "reports")
    os.makedirs(report_dir, exist_ok=True)
    file_path = os.path.join(report_dir, f"report_{report_id}_v{report.version}.docx")
    with open(file_path, "wb") as f:
        f.write(doc_bytes)

    report.file_path = file_path
    report.generated_at = datetime.utcnow()
    report.status = ReportStatus.IN_REVIEW
    db.commit()

    filename = f"audit_report_{report_id}.docx"
    return Response(
        content=doc_bytes,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.post("/reports/{report_id}/attest", response_model=AttestationOut, status_code=status.HTTP_201_CREATED)
def attest_report(report_id: int, data: AttestationCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    attestation = ReportAttestation(
        report_id=report_id,
        attested_by_id=current_user.id,
        role=data.role,
        signature_note=data.signature_note,
    )
    db.add(attestation)

    # Finalize report if it has attestations
    report.status = ReportStatus.FINAL
    db.commit()
    db.refresh(attestation)
    return attestation


@router.get("/reports/{report_id}/attestations", response_model=List[AttestationOut])
def list_attestations(report_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(ReportAttestation).filter(ReportAttestation.report_id == report_id).all()
