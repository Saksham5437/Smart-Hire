"""
SmartHire CLI Database Viewer
Prints formatted tables of all candidates, jobs, and applications directly in your terminal.
Usage: python database/view_data.py
"""
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from database.connection import SessionLocal
from database.models import User, Job, Application, Interview, SecurityEvent


def print_table(title, headers, rows):
    print(f"\n=== {title} ===")
    if not rows:
        print("(No records found)")
        return
    
    # Calculate column widths
    col_widths = [len(h) for h in headers]
    for row in rows:
        for idx, val in enumerate(row):
            str_val = str(val) if val is not None else "NULL"
            if len(str_val) > col_widths[idx]:
                col_widths[idx] = min(max(len(str_val), col_widths[idx]), 30)
    
    # Header row
    header_str = " | ".join(h.ljust(col_widths[i]) for i, h in enumerate(headers))
    divider = "-+-".join("-" * col_widths[i] for i in range(len(headers)))
    print(header_str)
    print(divider)
    
    # Data rows
    for row in rows:
        formatted = []
        for i, val in enumerate(row):
            str_val = str(val) if val is not None else "NULL"
            if len(str_val) > 30:
                str_val = str_val[:27] + "..."
            formatted.append(str_val.ljust(col_widths[i]))
        print(" | ".join(formatted))


def view_all():
    db = SessionLocal()
    try:
        # 1. Candidate Users
        candidates = db.query(User).filter(User.role == "candidate").all()
        cand_headers = ["ID", "Name", "Email", "Phone", "Location", "Education", "Experience", "Skills"]
        cand_rows = [
            [c.id, c.name, c.email, c.phone, c.location, c.education, c.experience, c.skills]
            for c in candidates
        ]
        print_table("CANDIDATES (Table: users)", cand_headers, cand_rows)

        # 2. HR Users
        hrs = db.query(User).filter(User.role == "hr").all()
        hr_headers = ["ID", "Name", "Email", "Company", "Department", "Designation"]
        hr_rows = [
            [h.id, h.name, h.email, h.company, h.department, h.designation]
            for h in hrs
        ]
        print_table("HR RECRUITERS (Table: users)", hr_headers, hr_rows)

        # 3. Active Jobs
        jobs = db.query(Job).all()
        job_headers = ["ID", "Title", "Company", "Location", "Type", "Status", "Deadline"]
        job_rows = [
            [j.id, j.title, j.company, j.location, j.employment_type, j.status, j.deadline]
            for j in jobs
        ]
        print_table("JOB POSTINGS (Table: jobs)", job_headers, job_rows)

        # 4. Applications & Pipeline
        apps = db.query(Application).all()
        app_headers = ["App ID", "Candidate", "Email", "Job Title", "Stage", "Screening %", "AI Score", "Decision"]
        app_rows = [
            [
                a.id,
                a.candidate.name if a.candidate else "N/A",
                a.candidate.email if a.candidate else "N/A",
                a.job.title if a.job else "N/A",
                a.stage,
                f"{a.screening_score}%" if a.screening_score is not None else "N/A",
                f"{a.ai_interview_score}/100" if a.ai_interview_score is not None else "N/A",
                a.final_decision or "Pending"
            ]
            for a in apps
        ]
        print_table("APPLICATIONS PIPELINE (Table: applications)", app_headers, app_rows)

        # 5. Scheduled Interviews
        interviews = db.query(Interview).all()
        int_headers = ["ID", "App ID", "Interviewer", "Format", "Date & Time", "Duration", "Platform"]
        int_rows = [
            [
                i.id,
                i.application_id,
                i.interviewer or "TBD",
                i.interview_type or "TBD",
                f"{i.scheduled_at.strftime('%Y-%m-%d') if i.scheduled_at else 'TBD'} {i.interview_time or ''}",
                i.duration or "TBD",
                i.meeting_platform or "TBD"
            ]
            for i in interviews
        ]
        print_table("SCHEDULED INTERVIEWS (Table: interviews)", int_headers, int_rows)

    finally:
        db.close()


if __name__ == "__main__":
    view_all()
