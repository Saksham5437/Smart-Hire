from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from ..db import get_db
from ..models import Application, Job, User, SecurityEvent, ApplicationStage, Interview
from ..schemas import ApplicationCreate, ApplicationResponse, SecurityEventCreate, InterviewScheduleCreate

router = APIRouter(prefix="/api/applications", tags=["Applications"])


@router.post("", response_model=ApplicationResponse)
def apply_to_job(payload: ApplicationCreate, db: Session = Depends(get_db)):
    """
    Candidate submits an application for a specific job.
    Includes duplicate check to prevent applying twice to the same job.
    """
    existing_app = db.query(Application).filter(
        Application.candidate_id == payload.candidate_id,
        Application.job_id == payload.job_id
    ).first()

    if existing_app:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Candidate has already submitted application #{existing_app.id} for this job."
        )

    new_app = Application(
        candidate_id=payload.candidate_id,
        job_id=payload.job_id,
        stage=ApplicationStage.APPLIED,
        identity_match_score=payload.identity_match_score,
        identity_match_status=payload.identity_match_status,
        identity_discrepancies=payload.identity_discrepancies
    )
    db.add(new_app)
    db.commit()
    db.refresh(new_app)
    return new_app


@router.get("", response_model=List[ApplicationResponse])
def get_all_applications(
    job_id: Optional[int] = None,
    candidate_id: Optional[int] = None,
    stage: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Retrieves applications, optionally filtered by candidate_id, job_id or stage.
    """
    query = db.query(Application)
    if candidate_id is not None:
        query = query.filter(Application.candidate_id == candidate_id)
    if job_id is not None:
        query = query.filter(Application.job_id == job_id)
    if stage is not None and stage.lower() != "all stages":
        query = query.filter(Application.stage == stage)

    return query.order_by(Application.created_at.desc()).all()


@router.get("/{application_id}", response_model=ApplicationResponse)
def get_application_by_id(application_id: int, db: Session = Depends(get_db)):
    """
    Critical Fix: Resolves the exact application by applicationId first,
    guaranteeing profile consistency and preventing candidate data mismatch.
    """
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application #{application_id} not found."
        )
    return app


@router.post("/{application_id}/security-event")
def record_security_event(
    application_id: int,
    payload: SecurityEventCreate,
    db: Session = Depends(get_db)
):
    """
    Records proctoring telemetry (e.g. TAB_SWITCH, MULTIPLE_FACES) tied to the application.
    """
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found."
        )

    event = SecurityEvent(
        application_id=application_id,
        event_type=payload.event_type,
        details=payload.details,
        severity=payload.severity or "info"
    )
    db.add(event)
    db.commit()
    db.refresh(event)

    return {"status": "recorded", "event_id": event.id, "application_id": application_id}


@router.get("/{application_id}/security-report")
def get_security_report(application_id: int, db: Session = Depends(get_db)):
    """
    Fetches the proctoring history for a specific application.
    """
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found."
        )

    events = (
        db.query(SecurityEvent)
        .filter(SecurityEvent.application_id == application_id)
        .order_by(SecurityEvent.created_at.desc())
        .all()
    )

    return {
        "application_id": application_id,
        "total_events": len(events),
        "events": [
            {
                "id": ev.id,
                "event_type": ev.event_type,
                "details": ev.details,
                "severity": ev.severity,
                "created_at": ev.created_at.isoformat() if ev.created_at else None
            }
            for ev in events
        ]
    }


@router.post("/{application_id}/schedule")
def schedule_human_interview(
    application_id: int,
    payload: InterviewScheduleCreate,
    db: Session = Depends(get_db)
):
    """
    Schedules human interview for a specific application.
    """
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application #{application_id} not found."
        )

    interview = db.query(Interview).filter(Interview.application_id == application_id).first()
    if not interview:
        interview = Interview(
            application_id=app.id,
            status="Interview Scheduled"
        )
        db.add(interview)

    interview.interviewer = payload.interviewer
    interview.interview_type = payload.interview_type
    interview.interview_time = payload.interview_time
    interview.duration = payload.duration
    interview.interview_mode = payload.interview_mode
    interview.meeting_platform = payload.meeting_platform
    interview.meeting_link = payload.meeting_link or f"https://meet.smarthire.com/{application_id}-interview"
    interview.notes = payload.notes
    interview.status = "Interview Scheduled"

    try:
        dt_str = f"{payload.interview_date} {payload.interview_time}"
        interview.scheduled_at = datetime.strptime(payload.interview_date, "%Y-%m-%d")
    except Exception:
        interview.scheduled_at = datetime.utcnow()

    app.stage = ApplicationStage.INTERVIEW_SCHEDULED

    db.commit()
    db.refresh(interview)
    db.refresh(app)

    return {
        "status": "scheduled",
        "application_id": application_id,
        "interviewer": interview.interviewer,
        "interview_type": interview.interview_type,
        "interview_date": payload.interview_date,
        "interview_time": interview.interview_time,
        "duration": interview.duration,
        "interview_mode": interview.interview_mode,
        "meeting_platform": interview.meeting_platform,
        "meeting_link": interview.meeting_link,
        "stage": app.stage
    }


@router.get("/{application_id}/schedule")
def get_interview_schedule(application_id: int, db: Session = Depends(get_db)):
    """
    Retrieves human interview schedule information for an application.
    """
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    interview = db.query(Interview).filter(Interview.application_id == application_id).first()
    return {
        "application_id": application_id,
        "candidate_name": app.candidate.name if app.candidate else "",
        "job_title": app.job.title if app.job else "",
        "stage": app.stage,
        "interviewer": interview.interviewer if interview else None,
        "interview_type": interview.interview_type if interview else None,
        "interview_time": interview.interview_time if interview else None,
        "duration": interview.duration if interview else None,
        "interview_mode": interview.interview_mode if interview else None,
        "meeting_platform": interview.meeting_platform if interview else None,
        "meeting_link": interview.meeting_link if interview else None,
        "scheduled_at": interview.scheduled_at.isoformat() if interview and interview.scheduled_at else None,
        "status": interview.status if interview else "Not Scheduled"
    }


@router.post("/{application_id}/final-decision")
def set_final_decision(
    application_id: int,
    payload: dict,
    db: Session = Depends(get_db)
):
    """
    HR sets the final recruitment decision (Selected / Rejected / On Hold).
    """
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found."
        )

    decision = payload.get("decision")
    if not decision:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Decision field is required."
        )

    app.final_decision = decision
    app.stage = decision
    db.commit()
    db.refresh(app)

    return {
        "message": f"Application #{application_id} finalized as {decision}.",
        "stage": app.stage,
        "final_decision": app.final_decision
    }