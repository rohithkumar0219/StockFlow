import os
import re
import unicodedata
from datetime import datetime, timedelta, timezone
from typing import Optional
import bcrypt
import httpx
import jwt
from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from .database import get_db
from .models import User, Organization

load_dotenv()

NEON_AUTH_BASE_URL = os.getenv("NEON_AUTH_BASE_URL", "").rstrip("/")
NEON_AUTH_ORIGIN = os.getenv("NEON_AUTH_ORIGIN", "http://localhost:5173")

# JWT Configuration
SECRET_KEY = "stockflow-production-grade-jwt-secret-key-32chars-min-wexai-2026"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24 * 7  # 7 days for MVP convenience

security = HTTPBearer()

def hash_password(password: str) -> str:
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    to_encode.update({"exp": expire})
    # Ensure 'sub' is string
    if "sub" in to_encode:
        to_encode["sub"] = str(to_encode["sub"])
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def slugify(text: str) -> str:
    text = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode('ascii')
    text = re.sub(r'[^\w\s-]', '', text).strip().lower()
    return re.sub(r'[-\s]+', '-', text)

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    token = credentials.credentials
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials or token expired",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id_raw = payload.get("sub")
        org_id = payload.get("org_id")
        if user_id_raw is None or org_id is None:
            raise credentials_exception
        user_id = int(user_id_raw)
    except Exception:
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id, User.org_id == org_id).first()
    if user is None:
        raise credentials_exception
    return user


def neon_auth_signup(email: str, password: str, name: str) -> dict:
    """Register a user in Neon Managed Better Auth."""
    if not NEON_AUTH_BASE_URL:
        return {}
    try:
        resp = httpx.post(
            f"{NEON_AUTH_BASE_URL}/sign-up/email",
            json={"email": email, "password": password, "name": name},
            headers={"Origin": NEON_AUTH_ORIGIN},
            timeout=10.0,
        )
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Neon Auth service unreachable: {exc}",
        )
    if resp.status_code >= 400:
        detail = "Neon Auth signup failed."
        try:
            detail = resp.json().get("message") or resp.json().get("error") or detail
        except Exception:
            pass
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)
    return resp.json()


def neon_auth_signin(email: str, password: str) -> dict:
    """Authenticate a user via Neon Managed Better Auth."""
    if not NEON_AUTH_BASE_URL:
        return {}
    try:
        resp = httpx.post(
            f"{NEON_AUTH_BASE_URL}/sign-in/email",
            json={"email": email, "password": password},
            headers={"Origin": NEON_AUTH_ORIGIN},
            timeout=10.0,
        )
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Neon Auth service unreachable: {exc}",
        )
    if resp.status_code >= 400:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
        )
    return resp.json()
