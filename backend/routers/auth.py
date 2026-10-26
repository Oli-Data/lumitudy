from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field, field_validator
from database import get_db, User, BrowserSession, generate_friend_code
from services.auth import (hash_password, verify_password, get_current_user,
    read_session, issue_session, require_trusted_origin)
from services.session_config import COOKIE_NAME, COOKIE_SECURE
from services.session_sockets import notify_revoked

router = APIRouter(prefix="/auth", tags=["auth"])


class UserLogin(BaseModel):
    email: str = Field(min_length=3, max_length=254)
    password: str = Field(min_length=1, max_length=72)

    @field_validator('password')
    @classmethod
    def bcrypt_length(cls, value):
        if len(value.encode('utf-8')) > 72:
            raise ValueError('Password must be at most 72 UTF-8 bytes.')
        return value


class UserCreate(UserLogin):
    username: str = Field(min_length=1, max_length=80)


class UserInfo(BaseModel):
    email: str
    username: str
    friend_code: str


class SessionInfo(BaseModel):
    user: UserInfo | None
    csrf_token: str


def session_info(session, db):
    user = db.get(User, session.user_id) if session.user_id is not None else None
    return {'user': ({'email': user.email, 'username': user.username,
                      'friend_code': user.friend_code} if user else None),
            'csrf_token': session.csrf_token}


def revoke_current(request, db):
    session = read_session(request.cookies.get(COOKIE_NAME), db)
    if session:
        token_hash = session.token_hash
        db.delete(session)
        db.commit()
        return token_hash
    return None


@router.get('/session', response_model=SessionInfo)
def bootstrap(request: Request, response: Response, db: Session = Depends(get_db)):
    # Same-origin GETs may omit Origin. Cross-site embedding cannot bootstrap cookies.
    origin = request.headers.get('origin')
    if origin:
        require_trusted_origin(origin)
    elif request.headers.get('sec-fetch-site') == 'cross-site':
        raise HTTPException(status_code=403, detail='Untrusted session request.')
    session = read_session(request.cookies.get(COOKIE_NAME), db, touch=True)
    if session is None:
        session = issue_session(response, db)
    return session_info(session, db)


@router.post('/register', response_model=SessionInfo)
async def register(user: UserCreate, request: Request, response: Response, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == user.email).first():
        raise HTTPException(status_code=400, detail='Email already registered')
    if db.query(User).filter(User.username == user.username).first():
        raise HTTPException(status_code=400, detail='Username already taken')
    friend_code = generate_friend_code()
    while db.query(User).filter(User.friend_code == friend_code).first():
        friend_code = generate_friend_code()
    from starlette.concurrency import run_in_threadpool
    hashed = await run_in_threadpool(hash_password, user.password)
    new_user = User(email=user.email, username=user.username,
                    friend_code=friend_code, hashed_password=hashed)
    db.add(new_user)
    db.commit()
    old = revoke_current(request, db)
    if old:
        notify_revoked(old)
    return session_info(issue_session(response, db, new_user.id), db)


@router.post('/login', response_model=SessionInfo)
async def login(user: UserLogin, request: Request, response: Response, db: Session = Depends(get_db)):
    from starlette.concurrency import run_in_threadpool
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user or not await run_in_threadpool(verify_password, user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail='Invalid credentials')
    old = revoke_current(request, db)
    if old:
        notify_revoked(old)
    return session_info(issue_session(response, db, db_user.id), db)


@router.post('/logout', status_code=204)
async def logout(request: Request, response: Response, db: Session = Depends(get_db)):
    old = revoke_current(request, db)
    if old:
        notify_revoked(old)
    response.delete_cookie(COOKIE_NAME, path='/', secure=COOKIE_SECURE,
                           httponly=True, samesite='lax')


@router.get('/me', response_model=UserInfo)
def get_me(current_user: User = Depends(get_current_user)):
    return {'email': current_user.email, 'username': current_user.username,
            'friend_code': current_user.friend_code}
