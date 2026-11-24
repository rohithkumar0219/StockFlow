import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, Organization
from ..schemas import UserSignupRequest, UserLoginRequest, TokenResponse, UserResponse
from ..auth import (
    NEON_AUTH_BASE_URL,
    hash_password,
    verify_password,
    create_access_token,
    slugify,
    get_current_user,
    neon_auth_signup,
    neon_auth_signin,
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def signup(req: UserSignupRequest, db: Session = Depends(get_db)):
    email = req.email.lower().strip()
    # Check if email is already taken
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )

    full_name = req.full_name or req.org_name.strip()
    if NEON_AUTH_BASE_URL:
        neon_auth_signup(email=email, password=req.password, name=full_name)

    # Generate unique slug for organization
    base_slug = slugify(req.org_name)
    if not base_slug:
        base_slug = "org"
    slug = base_slug
    counter = 1
    while db.query(Organization).filter(Organization.slug == slug).first():
        slug = f"{base_slug}-{counter}"
        counter += 1

    # Create Organization
    org = Organization(
        name=req.org_name.strip(),
        slug=slug,
        default_low_stock_threshold=5,
        currency="INR"
    )
    db.add(org)
    db.flush()  # Populates org.id

    # Create User
    user = User(
        org_id=org.id,
        email=email,
        hashed_password=hash_password(req.password),
        full_name=full_name,
        role="Owner"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    db.refresh(org)

    # Generate JWT with string sub
    token = create_access_token(data={"sub": str(user.id), "org_id": user.org_id, "email": user.email})

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

@router.post("/login", response_model=TokenResponse)
def login(req: UserLoginRequest, db: Session = Depends(get_db)):
    email = req.email.lower().strip()
    user = db.query(User).filter(User.email == email).first()

    if NEON_AUTH_BASE_URL:
        # Allow seeded local demo account or authenticate via Neon Managed Better Auth
        if user and email == "alex@apexhardware.com" and verify_password(req.password, user.hashed_password):
            pass
        else:
            auth_data = neon_auth_signin(email=email, password=req.password)
            if not user:
                # Auto-provision local organization & user for a valid Neon Auth account
                neon_user = auth_data.get("user") or {}
                display_name = neon_user.get("name") or email.split("@")[0]
                base_slug = slugify(display_name) or "org"
                slug = base_slug
                counter = 1
                while db.query(Organization).filter(Organization.slug == slug).first():
                    slug = f"{base_slug}-{counter}"
                    counter += 1
                org = Organization(
                    name=f"{display_name}'s Store",
                    slug=slug,
                    default_low_stock_threshold=5,
                    currency="INR",
                )
                db.add(org)
                db.flush()
                user = User(
                    org_id=org.id,
                    email=email,
                    hashed_password=hash_password(req.password),
                    full_name=display_name,
                    role="Owner",
                )
                db.add(user)
                db.commit()
                db.refresh(user)
    else:
        if not user or not verify_password(req.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password."
            )

    token = create_access_token(data={"sub": str(user.id), "org_id": user.org_id, "email": user.email})

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)
