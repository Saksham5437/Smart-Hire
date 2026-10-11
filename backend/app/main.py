from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import auth, users, jobs, applications, screening, interview

# Removed top-level Base.metadata.create_all(bind=engine) to fix Windows --reload crash.

app = FastAPI(title="SmartHire API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(jobs.router)
app.include_router(applications.router)
app.include_router(screening.router)
app.include_router(interview.router)

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "SmartHire API"}