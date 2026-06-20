from typing import Dict, List, Any, Optional
from sqlalchemy.orm import Session
from app.models.finding import RiskMatrix, RiskRating

DEFAULT_RISK_MATRIX = [
    {"label": "CRITICAL", "color": "#FF0000", "score": 5, "likelihood_min": 4, "impact_min": 4},
    {"label": "HIGH",     "color": "#FF6600", "score": 4, "likelihood_min": 3, "impact_min": 3},
    {"label": "MEDIUM",   "color": "#FFCC00", "score": 3, "likelihood_min": 2, "impact_min": 2},
    {"label": "LOW",      "color": "#00CC00", "score": 2, "likelihood_min": 1, "impact_min": 1},
    {"label": "INFORMATIONAL", "color": "#0099FF", "score": 1, "likelihood_min": 0, "impact_min": 0},
]


class RiskRatingService:
    def default_matrix(self) -> List[Dict[str, Any]]:
        return DEFAULT_RISK_MATRIX

    def rate_finding(self, likelihood: int, impact: int) -> str:
        """likelihood and impact on scale 1-5. Returns risk label."""
        score = likelihood * impact
        if score >= 16:
            return RiskRating.CRITICAL
        elif score >= 9:
            return RiskRating.HIGH
        elif score >= 4:
            return RiskRating.MEDIUM
        elif score >= 1:
            return RiskRating.LOW
        else:
            return RiskRating.INFORMATIONAL

    def apply_custom_matrix(self, engagement_id: int, matrix_data: Dict[str, Any], db: Session) -> RiskMatrix:
        # Deactivate existing default if needed
        existing = db.query(RiskMatrix).filter(
            RiskMatrix.engagement_id == engagement_id,
            RiskMatrix.is_default == True
        ).first()
        if existing and matrix_data.get("is_default"):
            existing.is_default = False
            db.add(existing)

        matrix = RiskMatrix(
            engagement_id=engagement_id,
            name=matrix_data["name"],
            levels=matrix_data["levels"],
            is_default=matrix_data.get("is_default", False),
        )
        db.add(matrix)
        db.commit()
        db.refresh(matrix)
        return matrix


risk_service = RiskRatingService()
