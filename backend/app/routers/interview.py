from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from ..db import get_db
from ..models import Application, Interview, ApplicationStage, EligibilityStatus
from ..services.ai_service import generate_interview_questions, evaluate_candidate_answer

router = APIRouter(prefix="/api/applications", tags=["AI Interview"])


class AnswerSubmission(BaseModel):
    question_id: int
    question_text: str
    answer_text: str


class CompleteInterviewPayload(BaseModel):
    answers: List[AnswerSubmission]


@router.post("/{application_id}/interview/start")
def start_or_resume_interview(application_id: int, db: Session = Depends(get_db)):
    """
    Initializes or resumes the AI interview session strictly keyed to application_id.
    Generates dynamic questions tailored to the job's required skills.
    """
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application #{application_id} not found."
        )

    # Check eligibility triage rules:
    # Match >= 85%: Eligible
    # Match >= 60%: Under Review
    # Match < 60%: Not Eligible
    if app.eligibility in [EligibilityStatus.NOT_ELIGIBLE, "Not Eligible"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Application #{application_id} is not eligible for the AI interview (Resume match score is below 60%)."
        )

    if app.eligibility in [EligibilityStatus.UNDER_REVIEW, "Under Review"] and app.stage not in [ApplicationStage.INTERVIEW_SCHEDULED, "Interview Scheduled"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Application #{application_id} is currently Under Review by HR (Resume match score 60%–84%). AI Interview will be unlocked upon HR approval."
        )

    job_title = app.job.title if app.job else "Software Engineer"
    job_skills = app.job.skills if app.job else "Technical Skills"

    # Check if an interview session record already exists
    interview = db.query(Interview).filter(Interview.application_id == application_id).first()
    
    if not interview:
        generated_questions = generate_interview_questions(job_title, job_skills)

        interview = Interview(
            application_id=app.id,
            questions_json=generated_questions,
            status="In Progress",
            scheduled_at=datetime.utcnow()
        )
        db.add(interview)
        app.stage = ApplicationStage.INTERVIEW_SCHEDULED
        db.commit()
        db.refresh(interview)
    elif not interview.questions_json or len(interview.questions_json) < 10:
        interview.questions_json = generate_interview_questions(job_title, job_skills)
        if not interview.status or interview.status == "Not Scheduled":
            interview.status = "In Progress"
        db.commit()
        db.refresh(interview)

    return {
        "interview_id": interview.id,
        "application_id": app.id,
        "status": interview.status,
        "questions": interview.questions_json or []
    }


@router.post("/{application_id}/interview/complete")
def finalize_interview(
    application_id: int,
    payload: CompleteInterviewPayload,
    db: Session = Depends(get_db)
):
    """
    Processes candidate responses through the AI evaluation engine,
    calculates metrics (relevance, correctness, completeness, skill alignment),
    stores answers and evaluations in interviews, and updates the application score.
    """
    app = db.query(Application).filter(Application.id == application_id).first()
    interview = db.query(Interview).filter(Interview.application_id == application_id).first()

    if not app or not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Active interview record not found for this application."
        )

    evaluations = []
    total_score = 0.0

    for item in payload.answers:
        eval_result = evaluate_candidate_answer(item.question_text, item.answer_text)
        evaluations.append({
            "question_id": item.question_id,
            "question": item.question_text,
            "answer": item.answer_text,
            **eval_result
        })
        total_score += eval_result["overall"]

    # Calculate overall interview score
    overall_score = round(total_score / len(payload.answers), 1) if payload.answers else 0.0

    interview.answers_json = [ans.model_dump() for ans in payload.answers]
    interview.result_json = evaluations
    interview.status = "Completed"

    app.ai_interview_score = overall_score
    app.stage = ApplicationStage.INTERVIEW_COMPLETED

    db.commit()
    db.refresh(app)

    return {
        "application_id": app.id,
        "ai_interview_score": app.ai_interview_score,
        "status": interview.status,
        "results": evaluations
    }


@router.get("/{application_id}/interview/results")
def get_interview_results(application_id: int, db: Session = Depends(get_db)):
    """
    Retrieves full transcript and question-by-question breakdown for HR review.
    """
    interview = db.query(Interview).filter(Interview.application_id == application_id).first()
    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No interview evaluation found for this application."
        )

    return {
        "application_id": application_id,
        "status": interview.status,
        "scheduled_at": interview.scheduled_at,
        "evaluations": interview.result_json or []
    }