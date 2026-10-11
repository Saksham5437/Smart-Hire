import re
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..db import get_db
from ..models import User, UserRole
from ..schemas import UserRegister, UserLogin, TokenResponse, UserResponse
from ..security import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/api/auth", tags=["Auth"])

def validate_password_rules(password: str, name: str = "", email: str = "") -> None:
    if not password or len(password) < 7:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 7 characters long."
        )
    if not re.search(r"[A-Z]", password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one uppercase capital letter."
        )
    if not re.search(r"[a-z]", password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one lowercase letter."
        )
    if not re.search(r"\d", password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one digit (0-9)."
        )
    if not re.search(r"[^A-Za-z0-9]", password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one symbol (e.g. !@#$%^&*)."
        )

    pwd_lower = password.lower()

    if name:
        name_tokens = [t.lower() for t in re.findall(r"[a-zA-Z0-9]+", name) if len(t) >= 2]
        for token in name_tokens:
            if token in pwd_lower:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Password must not include names used in your username or full name ('{token}')."
                )

    if email and "@" in email:
        email_username = email.split("@")[0].lower()
        if len(email_username) >= 3 and email_username in pwd_lower:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must not include your username."
            )


@router.post("/register", response_model=TokenResponse)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    clean_email = user_in.email.strip().lower()
    existing = db.query(User).filter(User.email.ilike(clean_email)).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already taken."
        )

    # Validate password rules
    validate_password_rules(user_in.password, user_in.name, clean_email)

    clean_phone = None
    if user_in.phone is not None and str(user_in.phone).strip():
        digits = re.sub(r"\D", "", str(user_in.phone))
        if len(digits) != 10:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Phone number must be exactly 10 digits."
            )
        clean_phone = digits

    role_enum = UserRole.HR if user_in.role.lower() == "hr" else UserRole.CANDIDATE

    user = User(
        name=user_in.name.strip(),
        email=clean_email,
        password_hash=hash_password(user_in.password),
        role=role_enum,
        phone=clean_phone,
        location=user_in.location,
        education=user_in.education,
        experience=user_in.experience,
        skills=user_in.skills,
        profile_summary=user_in.profile_summary,
        company=user_in.company,
        department=user_in.department,
        designation=user_in.designation
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id), "role": user.role.value})
    return {"access_token": token, "token_type": "bearer", "user": user}

@router.post("/login", response_model=TokenResponse)
def login(creds: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == creds.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    if not verify_password(creds.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    # Validate portal / role restriction if requested
    if creds.role:
        expected_role = creds.role.strip().lower()
        if expected_role == "candidate" and user.role != UserRole.CANDIDATE:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: This email belongs to an HR / Recruiter account. Please log in through the Recruiter Portal."
            )
        elif expected_role == "hr" and user.role != UserRole.HR:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: This email belongs to a Candidate account. Please log in through the Candidate Portal."
            )

    token = create_access_token({"sub": str(user.id), "role": user.role.value})
    return {"access_token": token, "token_type": "bearer", "user": user}