from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any

from ..db import get_db
from ..models import Application, ApplicationStage, EligibilityStatus, User
from ..services.ai_service import (
    screen_resume, parse_resume_data, extract_text_from_file_bytes,
    verify_identity_consistency
)

router = APIRouter(prefix="/api/applications", tags=["Screening"])


@router.post("/parse-resume")
async def parse_resume_for_autofill(
    file: UploadFile = File(...),
    candidate_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    Instantly extracts candidate info from uploaded resume and automatically performs
    identity consistency verification against the candidate's registered account.
    """
    if not file:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide a valid resume file."
        )

    raw_bytes = await file.read()
    if not raw_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file appears to be empty."
        )

    parsed_data = parse_resume_data(file.filename, raw_bytes)
    
    # Check if candidate_id provided to run real-time account-resume consistency check
    verification_result = None
    if candidate_id:
        user = db.query(User).filter(User.id == candidate_id).first()
        if user:
            account_data = {
                "name": user.name,
                "email": user.email,
                "phone": user.phone or "",
                "skills": user.skills or "",
                "education": user.education or ""
            }
            verification_result = verify_identity_consistency(account_data, parsed_data)

    return {
        "status": "success",
        "filename": file.filename,
        "data": parsed_data,
        "verification": verification_result
    }


@router.post("/verify-resume-identity")
async def verify_resume_identity(
    file: UploadFile = File(...),
    candidate_id: Optional[int] = Form(None),
    account_name: Optional[str] = Form(None),
    account_email: Optional[str] = Form(None),
    account_skills: Optional[str] = Form(None),
    account_phone: Optional[str] = Form(None),
    account_education: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """
    On-demand Identity Integrity Verification:
    Compares uploaded resume with candidate's registered account credentials.
    Returns side-by-side discrepancy breakdown and match verdict.
    """
    raw_bytes = await file.read()
    parsed_data = parse_resume_data(file.filename, raw_bytes)

    # Resolve account data from DB or provided form fields
    account_data = {}
    if candidate_id:
        user = db.query(User).filter(User.id == candidate_id).first()
        if user:
            account_data = {
                "name": user.name,
                "email": user.email,
                "phone": user.phone or "",
                "skills": user.skills or "",
                "education": user.education or ""
            }

    if not account_data.get("name") and account_name:
        account_data["name"] = account_name
    if not account_data.get("email") and account_email:
        account_data["email"] = account_email
    if not account_data.get("phone") and account_phone:
        account_data["phone"] = account_phone
    if not account_data.get("skills") and account_skills:
        account_data["skills"] = account_skills
    if not account_data.get("education") and account_education:
        account_data["education"] = account_education

    verification_result = verify_identity_consistency(account_data, parsed_data)

    return {
        "status": "success",
        "filename": file.filename,
        "parsed_data": parsed_data,
        "verification": verification_result
    }


@router.post("/{application_id}/screen")
async def run_resume_screening(
    application_id: int,
    file: Optional[UploadFile] = File(None),
    justification_note: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """
    Executes automated AI resume screening for a specific application.
    Extracts text from uploaded resume or defaults to candidate profile skills,
    computes skill match percentage against job requirements, and updates database records.
    Also verifies and records identity consistency metrics.
    """
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application #{application_id} not found."
        )

    resume_text_content = ""
    parsed_data = None

    # 1. Handle file upload if provided
    if file:
        raw_bytes = await file.read()
        resume_text_content = extract_text_from_file_bytes(file.filename, raw_bytes)
        parsed_data = parse_resume_data(file.filename, raw_bytes)
        app.resume_text = resume_text_content
        app.resume_path = f"uploads/{file.filename}"
    # 2. Use existing resume text if present
    elif app.resume_text:
        resume_text_content = app.resume_text
    # 3. Fallback to candidate profile data
    else:
        candidate_skills = app.candidate.skills if app.candidate and app.candidate.skills else ""
        candidate_edu = app.candidate.education if app.candidate and app.candidate.education else ""
        candidate_exp = app.candidate.experience if app.candidate and app.candidate.experience else ""
        resume_text_content = f"Candidate Profile Skills: {candidate_skills}. Education: {candidate_edu}. Experience: {candidate_exp}."
        app.resume_text = resume_text_content

    job_requirements = app.job.skills if app.job and app.job.skills else ""

    # Evaluate using AI screening logic
    screening_result = screen_resume(job_requirements, resume_text_content)

    # Perform Identity Verification against candidate account
    if app.candidate:
        account_data = {
            "name": app.candidate.name,
            "email": app.candidate.email,
            "phone": app.candidate.phone or "",
            "skills": app.candidate.skills or "",
            "education": app.candidate.education or ""
        }
        res_info = parsed_data or {
            "name": app.candidate.name,
            "email": app.candidate.email,
            "phone": app.candidate.phone or "",
            "skills": app.candidate.skills or "",
            "education": app.candidate.education or ""
        }
        id_verification = verify_identity_consistency(account_data, res_info)
        app.identity_match_score = id_verification["match_score"]

        if justification_note and justification_note.strip():
            app.identity_match_status = "Discrepancy Justified"
            id_verification["justification_note"] = justification_note.strip()
        else:
            app.identity_match_status = "Verified" if id_verification["is_verified"] else "Discrepancy Detected"
        
        app.identity_discrepancies = id_verification

    # Persist results to the specific application record
    app.screening_score = screening_result["score"]
    app.eligibility = screening_result["eligibility"]
    app.stage = ApplicationStage.SCREENING

    db.commit()
    db.refresh(app)

    return {
        "application_id": app.id,
        "candidate_id": app.candidate_id,
        "job_id": app.job_id,
        "screening_score": app.screening_score,
        "eligibility": app.eligibility,
        "matched_skills": screening_result["matched_skills"],
        "identity_match_score": app.identity_match_score,
        "identity_match_status": app.identity_match_status,
        "identity_discrepancies": app.identity_discrepancies,
        "stage": app.stage
    }


@router.get("/{application_id}/screening")
def get_screening_results(application_id: int, db: Session = Depends(get_db)):
    """
    Retrieves the screening scorecard for an exact application.
    """
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application #{application_id} not found."
        )

    return {
        "application_id": app.id,
        "candidate_name": app.candidate.name if app.candidate else "Unknown",
        "job_title": app.job.title if app.job else "Unknown",
        "screening_score": app.screening_score,
        "eligibility": app.eligibility,
        "stage": app.stage
    }


@router.post("/{application_id}/eligibility")
def update_application_eligibility(
    application_id: int,
    payload: Dict[str, Any],
    db: Session = Depends(get_db)
):
    """
    Allows HR to override or reconcile the eligibility triage verdict
    (e.g., manually approving an 'Under Review' applicant to 'Eligible' or 'Not Eligible').
    """
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application #{application_id} not found."
        )

    new_eligibility = payload.get("eligibility")
    if not new_eligibility or new_eligibility not in ["Eligible", "Under Review", "Not Eligible"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Eligibility must be 'Eligible', 'Under Review', or 'Not Eligible'."
        )

    if new_eligibility == "Eligible":
        app.eligibility = EligibilityStatus.ELIGIBLE
    elif new_eligibility == "Under Review":
        app.eligibility = EligibilityStatus.UNDER_REVIEW
    else:
        app.eligibility = EligibilityStatus.NOT_ELIGIBLE

    db.commit()
    db.refresh(app)

    return {
        "status": "success",
        "application_id": app.id,
        "eligibility": app.eligibility,
        "screening_score": app.screening_score,
        "stage": app.stage
    }