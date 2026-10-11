"""
Seed script to add 13 diverse tech job requisitions created by HR Manager.
"""
from app.db import SessionLocal
from app.models import Job, JobStatus, User, UserRole

def seed_jobs():
    db = SessionLocal()
    hr_user = db.query(User).filter(User.role == UserRole.HR).first()
    if not hr_user:
        print("No HR user found! Please register an HR account first.")
        return

    hr_id = hr_user.id
    print(f"Seeding jobs for HR user: {hr_user.name} (ID: {hr_id})")

    jobs_to_add = [
        {
            "title": "Senior Full Stack Engineer (React + Node.js)",
            "company": "SmartHire Tech Systems",
            "location": "Bengaluru, India (Hybrid)",
            "employment_type": "Full-time",
            "description": "Lead frontend and backend architecture for our hiring ecosystem. Design scalable GraphQL/REST APIs and fluid React user interfaces.",
            "skills": "React, Node.js, TypeScript, GraphQL, PostgreSQL, Docker, AWS, REST API, Tailwind CSS",
            "experience": "4-6 Years",
            "education": "B.Tech / B.E. / M.Tech in Computer Science",
            "deadline": "2026-11-30",
            "status": JobStatus.ACTIVE,
            "created_by": hr_id
        },
        {
            "title": "Backend Python & Distributed Systems Engineer",
            "company": "SmartHire Cloud Core",
            "location": "Hyderabad, India (Remote)",
            "employment_type": "Full-time",
            "description": "Build async microservices, Kafka event pipelines, and distributed Redis caches for high-throughput recruitment events.",
            "skills": "Python, FastAPI, Django, Redis, PostgreSQL, Kafka, Microservices, Docker, Kubernetes",
            "experience": "3-5 Years",
            "education": "B.Tech / B.E. / M.C.A. in Computer Science",
            "deadline": "2026-12-15",
            "status": JobStatus.ACTIVE,
            "created_by": hr_id
        },
        {
            "title": "Machine Learning & LLM Systems Engineer",
            "company": "SmartHire AI Labs",
            "location": "Bengaluru, India (On-site)",
            "employment_type": "Full-time",
            "description": "Develop and deploy Large Language Models, RAG pipelines, and automated speech-to-text evaluation systems for automated interviews.",
            "skills": "Python, PyTorch, LangChain, LLM, Transformers, HuggingFace, FastAPI, Vector Databases, Docker",
            "experience": "2-4 Years",
            "education": "B.Tech / M.Tech in AI / Data Science",
            "deadline": "2026-11-15",
            "status": JobStatus.ACTIVE,
            "created_by": hr_id
        },
        {
            "title": "DevOps & Cloud Infrastructure Architect",
            "company": "SmartHire Cloud Core",
            "location": "Pune, India (Remote)",
            "employment_type": "Full-time",
            "description": "Architect zero-downtime CI/CD deployment pipelines, manage multi-region Kubernetes clusters on AWS/GCP, and enforce IaC best practices.",
            "skills": "AWS, Kubernetes, Terraform, Docker, CI/CD, Linux, Prometheus, Grafana, Python",
            "experience": "5-8 Years",
            "education": "B.Tech / B.E. in Computer Science or IT",
            "deadline": "2026-12-31",
            "status": JobStatus.ACTIVE,
            "created_by": hr_id
        },
        {
            "title": "Frontend UI/UX React Developer",
            "company": "SmartHire Interactive",
            "location": "Mumbai, India (Hybrid)",
            "employment_type": "Full-time",
            "description": "Build high-performance web applications with cutting-edge micro-interactions, responsive design systems, and seamless state management.",
            "skills": "React, Next.js, TypeScript, Tailwind CSS, Redux, JavaScript, HTML, CSS",
            "experience": "1-3 Years",
            "education": "B.Tech / BCA / Any technical graduate",
            "deadline": "2026-11-20",
            "status": JobStatus.ACTIVE,
            "created_by": hr_id
        },
        {
            "title": "Data Engineer & Big Data Pipeline Specialist",
            "company": "SmartHire Data Platforms",
            "location": "Chennai, India (Hybrid)",
            "employment_type": "Full-time",
            "description": "Design and construct enterprise ETL/ELT data pipelines using Apache Spark, Kafka streaming, and Snowflake data warehouses.",
            "skills": "Python, Apache Spark, SQL, Kafka, Snowflake, Airflow, Hadoop, AWS",
            "experience": "3-5 Years",
            "education": "B.Tech / M.Tech in CSE / Data Analytics",
            "deadline": "2026-12-05",
            "status": JobStatus.ACTIVE,
            "created_by": hr_id
        },
        {
            "title": "Mobile App Developer (React Native & Mobile AI)",
            "company": "SmartHire Mobile",
            "location": "Bengaluru, India (Remote)",
            "employment_type": "Full-time",
            "description": "Deliver smooth cross-platform mobile experiences for iOS and Android using React Native with offline sync.",
            "skills": "React Native, TypeScript, JavaScript, Redux, iOS, Android, REST API, Firebase",
            "experience": "2-4 Years",
            "education": "B.Tech / BCA / MCA",
            "deadline": "2026-11-25",
            "status": JobStatus.ACTIVE,
            "created_by": hr_id
        },
        {
            "title": "Cybersecurity & Cloud Security Analyst",
            "company": "SmartHire Security & Compliance",
            "location": "Gurugram, India (On-site)",
            "employment_type": "Full-time",
            "description": "Safeguard cloud infrastructure against threats, manage SIEM log ingestion, and enforce zero-trust network policies.",
            "skills": "Linux, Network Security, Python, AWS, Docker, Penetration Testing, SIEM, Cryptography",
            "experience": "3-6 Years",
            "education": "B.Tech in Cybersecurity / IT",
            "deadline": "2026-12-10",
            "status": JobStatus.ACTIVE,
            "created_by": hr_id
        },
        {
            "title": "Software Development Engineer in Test (SDET)",
            "company": "SmartHire Quality Engineering",
            "location": "Noida, India (Remote)",
            "employment_type": "Full-time",
            "description": "Write automated testing suites for end-to-end web workflows, API integration validation, and performance benchmarking using Playwright.",
            "skills": "Python, Selenium, PyTest, Playwright, CI/CD, Docker, REST API, SQL",
            "experience": "2-5 Years",
            "education": "B.Tech / B.E. in Computer Science",
            "deadline": "2026-11-18",
            "status": JobStatus.ACTIVE,
            "created_by": hr_id
        },
        {
            "title": "Computer Vision & Deep Learning Scientist",
            "company": "SmartHire Vision Labs",
            "location": "Bengaluru, India (On-site)",
            "employment_type": "Full-time",
            "description": "Develop real-time facial landmark tracking, gaze estimation, and multi-face detection algorithms for automated proctoring.",
            "skills": "Python, OpenCV, PyTorch, TensorFlow, Deep Learning, Computer Vision, C++, Docker",
            "experience": "3-6 Years",
            "education": "M.Tech / M.S. / Ph.D. in Computer Vision",
            "deadline": "2026-12-20",
            "status": JobStatus.ACTIVE,
            "created_by": hr_id
        },
        {
            "title": "Golang High-Performance Microservices Engineer",
            "company": "SmartHire Cloud Core",
            "location": "Hyderabad, India (Hybrid)",
            "employment_type": "Full-time",
            "description": "Build low-latency gRPC services and WebSocket streaming gateways for real-time interview telemetry.",
            "skills": "Golang, gRPC, Microservices, Docker, Kubernetes, Redis, PostgreSQL, Kafka",
            "experience": "3-5 Years",
            "education": "B.Tech / B.E. in Computer Science",
            "deadline": "2026-12-25",
            "status": JobStatus.ACTIVE,
            "created_by": hr_id
        },
        {
            "title": "Junior AI / Data Science Associate",
            "company": "SmartHire AI Labs",
            "location": "Bengaluru, India (Remote)",
            "employment_type": "Internship",
            "description": "Work on exploratory data analysis, data cleaning, feature engineering, and model validation benchmarks.",
            "skills": "Python, Pandas, NumPy, Scikit-Learn, SQL, Data Analysis, Machine Learning",
            "experience": "0-1 Years / Fresher",
            "education": "B.Tech / B.Sc in Computer Science (2025/2026 Batch)",
            "deadline": "2026-10-31",
            "status": JobStatus.ACTIVE,
            "created_by": hr_id
        },
        {
            "title": "Cloud Database Administrator (DBA)",
            "company": "SmartHire Infrastructure",
            "location": "Kolkata, India (Remote)",
            "employment_type": "Full-time",
            "description": "Oversee database cluster topology, index tuning, transaction isolation, automated backup replication, and query optimization.",
            "skills": "MySQL, PostgreSQL, MongoDB, Redis, Database Optimization, Linux, AWS, SQL",
            "experience": "4-7 Years",
            "education": "B.Tech / MCA in IT / Computer Science",
            "deadline": "2026-12-28",
            "status": JobStatus.ACTIVE,
            "created_by": hr_id
        }
    ]

    for j in jobs_to_add:
        if not db.query(Job).filter(Job.title == j["title"]).first():
            db.add(Job(**j))
    db.commit()
    print("Database seeded with sample jobs successfully.")
    db.close()

if __name__ == "__main__":
    seed_jobs()
