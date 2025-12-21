from fastapi import HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.orm import Session
from authlib.integrations.starlette_client import OAuth
import jwt
import secrets
import os
from dotenv import load_dotenv

from database import get_db, UserDB

load_dotenv()

# Security configuration
# Use a persistent SECRET_KEY - in production, use environment variables
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here-change-in-production-use-env-vars-min-32-chars-long")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Google OAuth Configuration
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8080/api/auth/google/callback")

# Initialize OAuth
oauth = OAuth()
oauth.register(
    name='google',
    client_id=GOOGLE_CLIENT_ID,
    client_secret=GOOGLE_CLIENT_SECRET,
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={
        'scope': 'openid email profile'
    }
)

# Password hashing - using argon2 instead of bcrypt for better compatibility
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

# Security scheme
security = HTTPBearer()

# Pydantic models
class UserRegister(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str
    email: str

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = None

class User(BaseModel):
    username: str
    email: EmailStr
    hashed_password: str
    created_at: datetime

# Helper functions
def hash_password(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_user_by_email(email: str, db: Session) -> Optional[UserDB]:
    """Get user by email"""
    return db.query(UserDB).filter(UserDB.email == email).first()

def get_user_by_username(username: str, db: Session) -> Optional[UserDB]:
    """Get user by username"""
    return db.query(UserDB).filter(UserDB.username == username).first()

# Auth dependency
def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)) -> UserDB:
    """Get current authenticated user from JWT token"""
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        
        user = get_user_by_email(email, db)
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        
        return user
    
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except (jwt.PyJWTError, jwt.DecodeError, Exception) as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")

# Auth endpoints
def register_user(user_data: UserRegister, db: Session = Depends(get_db)) -> Token:
    """Register a new user"""
    # Check if user already exists
    if get_user_by_email(user_data.email, db):
        raise HTTPException(status_code=400, detail="Email already registered")
    
    if get_user_by_username(user_data.username, db):
        raise HTTPException(status_code=400, detail="Username already taken")
    
    # Create new user
    hashed_password = hash_password(user_data.password)
    new_user = UserDB(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hashed_password,
        created_at=datetime.utcnow(),
        oauth_provider="local",
        is_oauth_user=False
    )
    
    # Store user in database
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Create access token
    access_token = create_access_token(
        data={"sub": user_data.email},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    return Token(
        access_token=access_token,
        username=new_user.username,
        email=new_user.email
    )

def login_user(user_data: UserLogin, db: Session = Depends(get_db)) -> Token:
    """Login user"""
    user = get_user_by_email(user_data.email, db)
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Create access token
    access_token = create_access_token(
        data={"sub": user.email},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    return Token(
        access_token=access_token,
        username=user.username,
        email=user.email
    )

def get_user_profile(current_user: UserDB) -> dict:
    """Get user profile"""
    return {
        "username": current_user.username,
        "email": current_user.email,
        "created_at": current_user.created_at.isoformat()
    }

def update_user_profile(current_user: UserDB, update_data: UserUpdate, db: Session) -> dict:
    """Update user profile"""
    updated = False
    
    # Update username if provided
    if update_data.username and update_data.username != current_user.username:
        # Check if username is already taken
        existing_user = get_user_by_username(update_data.username, db)
        if existing_user and existing_user.email != current_user.email:
            raise HTTPException(status_code=400, detail="Username already taken")
        current_user.username = update_data.username
        updated = True
    
    # Update email if provided
    if update_data.email and update_data.email != current_user.email:
        # Check if email is already registered
        existing_user = get_user_by_email(update_data.email, db)
        if existing_user and existing_user.email != current_user.email:
            raise HTTPException(status_code=400, detail="Email already registered")
        current_user.email = update_data.email
        updated = True
    
    # Update password if provided
    if update_data.new_password:
        if not update_data.current_password:
            raise HTTPException(status_code=400, detail="Current password is required to set new password")
        
        # Verify current password
        if not verify_password(update_data.current_password, current_user.hashed_password):
            raise HTTPException(status_code=401, detail="Current password is incorrect")
        
        # Hash and update new password
        current_user.hashed_password = hash_password(update_data.new_password)
        updated = True
    
    if updated:
        db.commit()
        db.refresh(current_user)
    
    return {
        "message": "Profile updated successfully" if updated else "No changes made",
        "username": current_user.username,
        "email": current_user.email,
        "created_at": current_user.created_at.isoformat()
    }

def delete_user_account(current_user: UserDB, password: str, db: Session) -> dict:
    """Delete user account"""
    # Verify password before deletion
    if not verify_password(password, current_user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect password")
    
    # Delete user from database
    db.delete(current_user)
    db.commit()
    
    return {
        "message": "Account deleted successfully"
    }


# Google OAuth Functions
def get_or_create_oauth_user(email: str, username: str, oauth_id: str, db: Session) -> UserDB:
    """Get existing OAuth user or create new one"""
    user = get_user_by_email(email, db)
    
    if user:
        # Update OAuth info if user exists but wasn't OAuth before
        if not user.is_oauth_user:
            user.is_oauth_user = True
            user.oauth_provider = "google"
            user.oauth_id = oauth_id
            db.commit()
            db.refresh(user)
        return user
    
    # Create new OAuth user
    new_user = UserDB(
        email=email,
        username=username,
        hashed_password=None,  # No password for OAuth users
        created_at=datetime.utcnow(),
        oauth_provider="google",
        oauth_id=oauth_id,
        is_oauth_user=True
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user


def create_token_from_oauth_user(user: UserDB) -> Token:
    """Create access token for OAuth user"""
    access_token = create_access_token(
        data={"sub": user.email},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    return Token(
        access_token=access_token,
        username=user.username,
        email=user.email
    )
