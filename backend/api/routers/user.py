from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from backend.api.dependencies.auth import get_password_hash, verify_password, create_access_token
from backend.api.dependencies.database import get_db
from backend.api.models.user import User
from backend.api.schemas.user import UserResponse, UserCreate, Token, UserLogin

router = APIRouter(prefix="/user", tags=["User"])

@router.post("/register", response_model=UserResponse,
             status_code = status.HTTP_201_CREATED)
def register(user: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_pw = get_password_hash(user.password)
    new_user = User(name=user.name, email=str(user.email), hashed_password=hashed_pw)

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login", response_model=Token)
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()

    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Incorrect email or password")

    access_Token = create_access_token(data={"sub": str(db_user.id)})
    return {"access_token": access_Token, "token_type": "bearer"}