from pydantic import BaseModel, EmailStr
from typing import Optional, List, Any
from datetime import datetime

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "candidate"
    phone: Optional[str] = None
    location: Optional[str] = None
    education: Optional[str] = None
    experience: Optional[str] = None
    skills: Optional[str] = None
    profile_summary: Optional[str] = None
    company: Optional[str] = None
    department: Optional[str] = None
    designation: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str
    role: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str
    phone: Optional[str] = None
    location: Optional[str] = None
    education: Optional[str] = None
    experience: Optional[str] = None
    skills: Optional[str] = None
    profile_summary: Optional[str] = None
    company: Optional[str] = None
    department: Optional[str] = None
    designation: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class JobCreate(BaseModel):
    title: str
    company: str
    location: str
    employment_type: str
    description: str
    skills: str
    experience: str
    education: str
    deadline: Optional[str] = None

class JobResponse(JobCreate):
    id: int
    status: str
    created_by: int
    created_at: datetime

    class Config:
        from_attributes = True

class ApplicationCreate(BaseModel):
    job_id: int
    candidate_id: int
    identity_match_score: Optional[float] = None
    identity_match_status: Optional[str] = None
    identity_discrepancies: Optional[Any] = None

class ApplicationResponse(BaseModel):
    id: int
    candidate_id: int
    job_id: int
    resume_path: Optional[str] = None
    screening_score: Optional[float] = None
    eligibility: str
    stage: str
    ai_interview_score: Optional[float] = None
    identity_match_score: Optional[float] = None
    identity_match_status: Optional[str] = None
    identity_discrepancies: Optional[Any] = None
    final_decision: Optional[str] = None
    created_at: datetime
    candidate: Optional[UserResponse] = None
    job: Optional[JobResponse] = None

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    education: Optional[str] = None
    experience: Optional[str] = None
    skills: Optional[str] = None
    profile_summary: Optional[str] = None
    company: Optional[str] = None
    department: Optional[str] = None
    designation: Optional[str] = None

class JobUpdate(BaseModel):
    title: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    employment_type: Optional[str] = None
    description: Optional[str] = None
    skills: Optional[str] = None
    experience: Optional[str] = None
    education: Optional[str] = None
    deadline: Optional[str] = None
    status: Optional[str] = None

class InterviewScheduleCreate(BaseModel):
    interviewer: str
    interview_type: str
    interview_date: str
    interview_time: str
    duration: Optional[str] = "45 minutes"
    interview_mode: Optional[str] = "Online — Video Call"
    meeting_platform: Optional[str] = "Google Meet"
    meeting_link: Optional[str] = None
    send_email: Optional[bool] = True
    add_to_calendar: Optional[bool] = True
    notes: Optional[str] = None

class InterviewResponse(BaseModel):
    id: int
    application_id: int
    questions_json: Optional[Any] = None
    answers_json: Optional[Any] = None
    result_json: Optional[Any] = None
    status: str
    scheduled_at: Optional[datetime] = None
    interviewer: Optional[str] = None
    interview_type: Optional[str] = None
    interview_time: Optional[str] = None
    duration: Optional[str] = None
    interview_mode: Optional[str] = None
    meeting_platform: Optional[str] = None
    meeting_link: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class SecurityEventCreate(BaseModel):
    event_type: str
    details: Optional[str] = None
    severity: Optional[str] = "info"