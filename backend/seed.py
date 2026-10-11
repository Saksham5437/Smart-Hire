from app.db import SessionLocal, engine, Base
from app.models import User, Job, Application, UserRole, JobStatus, ApplicationStage
from app.security import hash_password

# 1. Ensure all schema tables exist in the database
Base.metadata.create_all(bind=engine)
db = SessionLocal()


def seed_smarthire():
    print("Beginning SmartHire database provisioning and seeding...")

    # 2. Seed HR Account
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
        print("✓ Created HR account: hr@smarthire.com (pass: admin123)")
    else:
        print("• HR account already exists.")

    # 3. Seed Candidate Account (Rahul Verma)
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
        print("✓ Created Candidate account: rahul@example.com (pass: candidate123)")
    else:
        print("• Candidate account already exists.")

    # 4. Seed Standard Job Openings
    existing_jobs = db.query(Job).count()
    if existing_jobs == 0:
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
        print(f"✓ Created {len(jobs)} active job listings.")
    else:
        print("• Job listings already exist.")

    db.close()
    print("SmartHire database seed complete. All tables and accounts ready.")


if __name__ == "__main__":
    seed_smarthire()