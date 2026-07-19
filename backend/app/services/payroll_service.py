from app.extensions import db
from app.models.payroll import Payroll, SalaryStructure
from app.models.attendance import Attendance
from decimal import Decimal, InvalidOperation

class PayrollService:
    @staticmethod
    def _to_decimal(value, field_name):
        """الإصلاح (دقة الأرقام المالية): كان Decimal(overtime_hours) يُستدعى
        مباشرة على float قادم من JSON، وهذا ينتج تمثيلًا عشريًا غير دقيق
        (Decimal(0.1) != 0.1) بسبب طريقة تخزين الـ float نفسها في الذاكرة.
        المرور عبر str() أولاً يعطي القيمة العشرية الصحيحة كما كتبها المستخدم."""
        try:
            return Decimal(str(value))
        except (InvalidOperation, TypeError):
            raise ValueError(f"{field_name} must be a valid number")

    @staticmethod
    def generate_payroll(employee_id, month, year, bonus=0, overtime_hours=0, deduction=0, preview=False):
        # الإصلاح (تحقق من المدخلات): لم يكن هناك أي تحقق سابقًا على شهر/سنة
        # صالحين أو أن القيم المالية غير سالبة.
        if not isinstance(month, int) or not (1 <= month <= 12):
            raise ValueError("month must be an integer between 1 and 12")
        if not isinstance(year, int) or not (2000 <= year <= 2100):
            raise ValueError("year must be a valid 4-digit year")

        bonus = PayrollService._to_decimal(bonus, "bonus")
        overtime_hours = PayrollService._to_decimal(overtime_hours, "overtime_hours")
        deduction = PayrollService._to_decimal(deduction, "deduction")

        if bonus < 0 or overtime_hours < 0 or deduction < 0:
            raise ValueError("bonus, overtime_hours, and deduction must not be negative")

        structure = SalaryStructure.query.filter_by(employee_id=employee_id).first()
        if not structure:
            raise ValueError("Salary structure not defined for this employee")

        if bonus > 0 and not structure.bonus_allowed:
            raise ValueError("This employee is not eligible for a bonus")

        if not preview:
            existing = Payroll.query.filter_by(employee_id=employee_id, month=month, year=year).first()
            if existing:
                raise ValueError("Payroll already generated for this employee for the given month/year")

        # Calculate late fines for the month
        late_fines_sum = db.session.query(db.func.sum(Attendance.late_fine)).filter(
            Attendance.employee_id == employee_id,
            db.extract('month', Attendance.date) == month,
            db.extract('year', Attendance.date) == year
        ).scalar() or 0
        late_fines_sum = PayrollService._to_decimal(late_fines_sum, "late_fines_sum")

        overtime_pay = overtime_hours * structure.overtime_rate
        net_salary = structure.basic_salary + bonus + overtime_pay - deduction - late_fines_sum
        
        if net_salary < 0:
            net_salary = Decimal('0.00')

        payroll = Payroll(**{  # type: ignore
            "employee_id": employee_id,
            "month": month,
            "year": year,
            "basic_salary": structure.basic_salary,
            "bonus": bonus,
            "overtime": overtime_pay,
            "deduction": deduction,
            "late_fine": late_fines_sum,
            "net_salary": net_salary
        })

        if not preview:
            db.session.add(payroll)
            db.session.commit()
        return payroll

    @staticmethod
    def get_payroll_history(employee_id):
        return Payroll.query.filter_by(employee_id=employee_id).order_by(Payroll.year.desc(), Payroll.month.desc()).all()
