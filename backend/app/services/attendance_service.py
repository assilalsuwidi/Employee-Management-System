from datetime import date, datetime, time
from app.extensions import db
from app.models.attendance import Attendance, Holiday, Weekend

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
    
    # Check if late (Assuming 09:00 AM is the standard start time)
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
