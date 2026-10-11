from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from ..db import get_db
from ..models import Job, JobStatus
from ..schemas import JobCreate, JobResponse, JobUpdate

router = APIRouter(prefix="/api/jobs", tags=["Jobs"])

@router.get("", response_model=List[JobResponse])
def get_jobs(status: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Job)
    if status and status.lower() != "all":
        query = query.filter(Job.status == status)
    return query.order_by(Job.created_at.desc()).all()

@router.get("/{job_id}", response_model=JobResponse)
def get_job_detail(job_id: int, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

@router.post("", response_model=JobResponse)
def create_job(job_in: JobCreate, created_by: int = 1, db: Session = Depends(get_db)):
    job = Job(
        **job_in.model_dump(),
        created_by=created_by,
        status=JobStatus.ACTIVE
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return job

@router.put("/{job_id}", response_model=JobResponse)
def update_job(job_id: int, payload: JobUpdate, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    update_data = payload.model_dump(exclude_unset=True)
    if "status" in update_data and update_data["status"]:
        update_data["status"] = JobStatus.ACTIVE if update_data["status"].lower() == "active" else JobStatus.CLOSED

    for key, value in update_data.items():
        if value is not None:
            setattr(job, key, value)
    
    db.commit()
    db.refresh(job)
    return job

@router.patch("/{job_id}/status", response_model=JobResponse)
def toggle_job_status(job_id: int, status_val: str, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    job.status = JobStatus.ACTIVE if status_val.lower() == "active" else JobStatus.CLOSED
    db.commit()
    db.refresh(job)
    return job