import enum
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Text, ForeignKey, 
    DateTime, Enum, Float, JSON
)
from sqlalchemy.orm import relationship
from .db import Base

class UserRole(str, enum.Enum):
    CANDIDATE = "candidate"
    HR = "hr"

class JobStatus(str, enum.Enum):
    ACTIVE = "Active"
    CLOSED = "Closed"

class ApplicationStage(str, enum.Enum):
    APPLIED = "Applied"
    SCREENING = "Screening"
    INTERVIEW_SCHEDULED = "Interview Scheduled"
    INTERVIEW_COMPLETED = "Interview Completed"
    HR_REVIEW = "HR Review"
    SELECTED = "Selected"
    REJECTED = "Rejected"
    ON_HOLD = "On Hold"

class EligibilityStatus(str, enum.Enum):
    ELIGIBLE = "Eligible"
    NOT_ELIGIBLE = "Not Eligible"
    UNDER_REVIEW = "Under Review"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(120), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.CANDIDATE, nullable=False)
    phone = Column(String(30), nullable=True)
    location = Column(String(180), nullable=True)
    education = Column(String(255), nullable=True)
    experience = Column(String(120), nullable=True)
    skills = Column(Text, nullable=True)
    profile_summary = Column(Text, nullable=True)
    company = Column(String(180), nullable=True)
    department = Column(String(120), nullable=True)
    designation = Column(String(120), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    applications = relationship("Application", back_populates="candidate", cascade="all, delete-orphan")
    posted_jobs = relationship("Job", back_populates="creator")

class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(150), nullable=False)
    company = Column(String(180), nullable=False)
    location = Column(String(180), nullable=False)
    employment_type = Column(String(80), nullable=False)
    description = Column(Text, nullable=False)
    skills = Column(Text, nullable=False)
    experience = Column(String(100), nullable=False)
    education = Column(String(150), nullable=False)
    deadline = Column(String(80), nullable=True)
    status = Column(Enum(JobStatus), default=JobStatus.ACTIVE, nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    creator = relationship("User", back_populates="posted_jobs")
    applications = relationship("Application", back_populates="job", cascade="all, delete-orphan")

class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    candidate_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    resume_path = Column(String(255), nullable=True)
    resume_text = Column(Text, nullable=True)
    screening_score = Column(Float, nullable=True)
    eligibility = Column(Enum(EligibilityStatus), default=EligibilityStatus.UNDER_REVIEW)
    stage = Column(Enum(ApplicationStage), default=ApplicationStage.APPLIED)
    ai_interview_score = Column(Float, nullable=True)
    identity_match_score = Column(Float, nullable=True)
    identity_match_status = Column(String(50), nullable=True)
    identity_discrepancies = Column(JSON, nullable=True)
    final_decision = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    candidate = relationship("User", back_populates="applications")
    job = relationship("Job", back_populates="applications")
    interview = relationship("Interview", back_populates="application", uselist=False, cascade="all, delete-orphan")
    security_events = relationship("SecurityEvent", back_populates="application", cascade="all, delete-orphan")

class Interview(Base):
    __tablename__ = "interviews"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    application_id = Column(Integer, ForeignKey("applications.id"), unique=True, nullable=False)
    questions_json = Column(JSON, nullable=True)
    answers_json = Column(JSON, nullable=True)
    result_json = Column(JSON, nullable=True)
    status = Column(String(50), default="Scheduled")
    scheduled_at = Column(DateTime, nullable=True)
    interviewer = Column(String(150), nullable=True)
    interview_type = Column(String(100), nullable=True)
    interview_time = Column(String(50), nullable=True)
    duration = Column(String(50), nullable=True)
    interview_mode = Column(String(50), nullable=True)
    meeting_platform = Column(String(100), nullable=True)
    meeting_link = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    application = relationship("Application", back_populates="interview")

class SecurityEvent(Base):
    __tablename__ = "security_events"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False)
    event_type = Column(String(100), nullable=False)
    details = Column(Text, nullable=True)
    severity = Column(String(20), default="info")
    created_at = Column(DateTime, default=datetime.utcnow)

    application = relationship("Application", back_populates="security_events")