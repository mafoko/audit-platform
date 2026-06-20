from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.finding import Finding, RiskMatrix, RiskRating, FindingStatus
from app.models.engagement import Engagement
from app.schemas.finding import FindingCreate, FindingUpdate, FindingOut, RiskMatrixCreate, RiskMatrixOut
from app.utils.auth import get_current_user
from app.models.user import User
from app.services.risk_rating import risk_service

router = APIRouter(tags=["findings"])


@router.post("/engagements/{engagement_id}/findings", response_model=FindingOut, status_code=status.HTTP_201_CREATED)
def create_finding(engagement_id: int, data: FindingCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    engagement = db.query(Engagement).filter(Engagement.id == engagement_id).first()
    if not engagement:
        raise HTTPException(status_code=404, detail="Engagement not found")
    finding = Finding(
        engagement_id=engagement_id,
        created_by_id=current_user.id,
        **data.model_dump(),
    )
    db.add(finding)
    db.commit()
    db.refresh(finding)
    return finding


@router.get("/engagements/{engagement_id}/findings", response_model=List[FindingOut])
def list_findings(
    engagement_id: int,
    risk_rating: Optional[RiskRating] = Query(None),
    finding_status: Optional[FindingStatus] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Finding).filter(Finding.engagement_id == engagement_id)
    if risk_rating:
        query = query.filter(Finding.risk_rating == risk_rating)
    if finding_status:
        query = query.filter(Finding.status == finding_status)
    return query.all()


@router.get("/findings/{finding_id}", response_model=FindingOut)
def get_finding(finding_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    finding = db.query(Finding).filter(Finding.id == finding_id).first()
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")
    return finding


@router.put("/findings/{finding_id}", response_model=FindingOut)
def update_finding(finding_id: int, data: FindingUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    finding = db.query(Finding).filter(Finding.id == finding_id).first()
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(finding, field, value)
    db.commit()
    db.refresh(finding)
    return finding


@router.delete("/findings/{finding_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_finding(finding_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    finding = db.query(Finding).filter(Finding.id == finding_id).first()
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")
    db.delete(finding)
    db.commit()


# Risk Matrix endpoints
@router.post("/engagements/{engagement_id}/risk-matrices", response_model=RiskMatrixOut, status_code=status.HTTP_201_CREATED)
def create_risk_matrix(engagement_id: int, data: RiskMatrixCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    engagement = db.query(Engagement).filter(Engagement.id == engagement_id).first()
    if not engagement:
        raise HTTPException(status_code=404, detail="Engagement not found")
    matrix = risk_service.apply_custom_matrix(engagement_id, data.model_dump(), db)
    return matrix


@router.get("/engagements/{engagement_id}/risk-matrices", response_model=List[RiskMatrixOut])
def list_risk_matrices(engagement_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(RiskMatrix).filter(RiskMatrix.engagement_id == engagement_id).all()


@router.get("/engagements/{engagement_id}/risk-matrices/default")
def get_default_matrix(engagement_id: int, current_user: User = Depends(get_current_user)):
    return risk_service.default_matrix()


@router.post("/risk-rating/calculate")
def calculate_risk_rating(likelihood: int = Query(..., ge=1, le=5), impact: int = Query(..., ge=1, le=5), current_user: User = Depends(get_current_user)):
    rating = risk_service.rate_finding(likelihood, impact)
    return {"likelihood": likelihood, "impact": impact, "rating": rating}
