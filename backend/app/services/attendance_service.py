from datetime import date, datetime, time, timedelta
from app.extensions import db
from app.models.attendance import Attendance, Holiday, Weekend
from app.models.payroll import LoginRule

def record_attendance(employee_id: int):
    today = date.today()
    now_time = datetime.now().time()
    
    # Check if already marked
    existing = Attendance.query.filter_by(employee_id=employee_id, date=today).first()
    if existing:
        return False, "Already marked today"
        
    # Check if holiday
    is_holiday = Holiday.query.filter_by(holiday_date=today).first() is not None
    
    # Check if weekend (e.g., Friday, Saturday)
    day_name = today.strftime("%A")
    is_weekend = Weekend.query.filter_by(day_of_week=day_name).first() is not None
    
    # Check LoginRule for late calculation
    rule = LoginRule.query.filter_by(employee_id=employee_id).first()
    if rule:
        # Combine with today's date to safely add the grace period
        base_datetime = datetime.combine(today, rule.login_time)
        allowed_datetime = base_datetime + timedelta(minutes=rule.grace_period_minutes)
        allowed_time = allowed_datetime.time()
        
        is_late = now_time > allowed_time
        late_fine = float(rule.fine_per_day) if is_late else 0.0
    else:
        # Fallback to defaults if HR hasn't defined a rule for this employee yet
        is_late = now_time > time(9, 0)
        late_fine = 50.0 if is_late else 0.0
    
    record = Attendance(
        employee_id=employee_id,
        date=today,
        check_in=now_time,
        is_late=is_late,
        is_holiday=is_holiday,
        is_weekend=is_weekend,
        late_fine=late_fine
    )
    db.session.add(record)
    db.session.commit()
    return True, "Attendance recorded"
