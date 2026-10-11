"""
SmartHire Database Provisioning and Initialization Script
Runs table migrations and populates demo accounts.
"""
import sys
import os
import pymysql
import bcrypt
from datetime import datetime

# Add root directory to sys.path so database package can be imported directly
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from database.connection import Base, engine, SessionLocal, DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
from database.models import User, Job, Application, UserRole, JobStatus, ApplicationStage


def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def ensure_database_exists():
    """Ensures that the MySQL database exists before SQLAlchemy connects."""
    try:
        conn = pymysql.connect(
            host=DB_HOST,
            port=int(DB_PORT),
            user=DB_USER,
            password=DB_PASSWORD
        )
        with conn.cursor() as cursor:
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{DB_NAME}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
        conn.commit()
        conn.close()
        print(f"[OK] MySQL Database `{DB_NAME}` verified/created.")
    except Exception as e:
        print(f"[*] Notice: Ensure MySQL service is running on {DB_HOST}:{DB_PORT}. Detail: {e}")


def init_and_seed():
    print("==================================================")
    print("Initializing SmartHire Database...")
    print("==================================================")

    # 1. Verify Database
    ensure_database_exists()

    # 2. Create Schema
    Base.metadata.create_all(bind=engine)
    print("[OK] Created database tables (users, jobs, applications, interviews, security_events).")

    # 3. Seed Accounts & Data
    db = SessionLocal()
    try:
        # Seed HR Account
        hr = db.query(User).filter(User.email == "hr@smarthire.com").first()
        if not hr:
            hr = User(
                name="HR Manager",
                email="hr@smarthire.com",
                password_hash=hash_password("admin123"),
                role=UserRole.HR,
                company="SmartHire Tech",
                department="Talent Acquisition",
                designation="Lead Technical Recruiter"
            )
            db.add(hr)
            db.commit()
            db.refresh(hr)
            print("[OK] Seeded HR account: hr@smarthire.com (password: admin123)")
        else:
            print("[*] HR account already exists.")

        # Seed Candidate Account
        candidate = db.query(User).filter(User.email == "rahul@example.com").first()
        if not candidate:
            candidate = User(
                name="Rahul Verma",
                email="rahul@example.com",
                password_hash=hash_password("candidate123"),
                role=UserRole.CANDIDATE,
                phone="+91 9876543210",
                location="Bengaluru, India",
                education="B.Tech in Artificial Intelligence & Machine Learning",
                experience="1 Year - ML Intern",
                skills="Python, PyTorch, FastAPI, MySQL, Machine Learning, Docker",
                profile_summary="Passionate AI/ML engineer focused on productionizing NLP pipelines and microservices."
            )
            db.add(candidate)
            db.commit()
            db.refresh(candidate)
            print("[OK] Seeded Candidate account: rahul@example.com (password: candidate123)")
        else:
            print("[*] Candidate account already exists.")

        # Seed Jobs
        job_count = db.query(Job).count()
        if job_count == 0:
            jobs = [
                Job(
                    title="AI / ML Engineer",
                    company="SmartHire Tech",
                    location="Bengaluru, India",
                    employment_type="Full-time",
                    description="Design, deploy, and scale machine learning systems, LLM evaluation pipelines, and APIs.",
                    skills="Python, PyTorch, FastAPI, Docker, NLP",
                    experience="1-3 Years",
                    education="B.Tech / M.Tech in CS / AIML",
                    deadline="2026-12-31",
                    status=JobStatus.ACTIVE,
                    created_by=hr.id
                ),
                Job(
                    title="Data Analyst",
                    company="SmartHire Tech",
                    location="Bengaluru, India",
                    employment_type="Full-time",
                    description="Analyze recruitment lifecycle data, candidate performance metrics, and build automated reports.",
                    skills="Python, SQL, Tableau, Statistics",
                    experience="0-2 Years",
                    education="Any STEM Graduate",
                    deadline="2026-11-30",
                    status=JobStatus.ACTIVE,
                    created_by=hr.id
                )
            ]
            db.add_all(jobs)
            db.commit()
            print(f"[OK] Seeded {len(jobs)} active job postings.")
        else:
            print("[*] Job postings already exist.")

        print("\nDatabase initialization completed successfully!")
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Error during seeding: {e}")
        raise
    finally:
        db.close()



if __name__ == "__main__":
    init_and_seed()
