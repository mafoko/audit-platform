from datetime import datetime, timedelta
from typing import Tuple, List
from sqlalchemy.orm import Session
from app.config import settings
from app.models.evidence import EvidenceRequest, EvidenceStatus


class WorkingHoursCalculator:
    def __init__(self):
        self.start_hour = settings.WORKING_HOURS_START
        self.end_hour = settings.WORKING_HOURS_END
        self.working_days = settings.WORKING_DAYS
        self.hours_per_day = self.end_hour - self.start_hour

    def _is_working_day(self, dt: datetime) -> bool:
        return dt.weekday() in self.working_days

    def _next_working_day_start(self, dt: datetime) -> datetime:
        next_day = dt + timedelta(days=1)
        while not self._is_working_day(next_day):
            next_day += timedelta(days=1)
        return next_day.replace(hour=self.start_hour, minute=0, second=0, microsecond=0)

    def calculate_due_date(self, start: datetime, working_hours: int) -> datetime:
        current = start
        # If start is not a working day, move to next working day start
        if not self._is_working_day(current):
            current = self._next_working_day_start(current)
        # If start is before business hours, set to business hours start
        elif current.hour < self.start_hour:
            current = current.replace(hour=self.start_hour, minute=0, second=0, microsecond=0)
        # If start is after business hours, move to next working day
        elif current.hour >= self.end_hour:
            current = self._next_working_day_start(current)

        remaining_hours = working_hours
        while remaining_hours > 0:
            end_of_day = current.replace(hour=self.end_hour, minute=0, second=0, microsecond=0)
            hours_left_today = (end_of_day - current).total_seconds() / 3600
            if remaining_hours <= hours_left_today:
                current = current + timedelta(hours=remaining_hours)
                remaining_hours = 0
            else:
                remaining_hours -= hours_left_today
                current = self._next_working_day_start(current)

        return current

    def calculate_delay(self, due_at: datetime, submitted_at: datetime) -> Tuple[bool, float]:
        if submitted_at <= due_at:
            return False, 0.0
        # Calculate working hours between due_at and submitted_at
        delay_hours = self._count_working_hours(due_at, submitted_at)
        return True, delay_hours

    def _count_working_hours(self, start: datetime, end: datetime) -> float:
        if start >= end:
            return 0.0
        total = 0.0
        current = start
        while current < end:
            if self._is_working_day(current) and self.start_hour <= current.hour < self.end_hour:
                next_boundary = min(
                    end,
                    current.replace(hour=self.end_hour, minute=0, second=0, microsecond=0)
                )
                total += (next_boundary - current).total_seconds() / 3600
                current = next_boundary
            else:
                # Advance to next working hour
                if not self._is_working_day(current) or current.hour >= self.end_hour:
                    current = self._next_working_day_start(current)
                else:
                    current = current.replace(hour=self.start_hour, minute=0, second=0, microsecond=0)
        return total

    def get_overdue_requests(self, db: Session) -> List[EvidenceRequest]:
        now = datetime.utcnow()
        overdue = db.query(EvidenceRequest).filter(
            EvidenceRequest.status == EvidenceStatus.PENDING,
            EvidenceRequest.due_at <= now,
            EvidenceRequest.due_at.isnot(None)
        ).all()
        for req in overdue:
            req.status = EvidenceStatus.OVERDUE
        if overdue:
            db.commit()
        return overdue


calculator = WorkingHoursCalculator()
