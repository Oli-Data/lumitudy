import hashlib
import secrets
from datetime import datetime, timedelta
import bcrypt
from fastapi import Depends, HTTPException, Request, Response
from sqlalchemy.orm import Session
from starlette.requests import HTTPConnection
from database import get_db, User, UserFile, BrowserSession
from services.storage import user_file_path
from services.session_config import (COOKIE_NAME, COOKIE_SECURE, ALLOWED_ORIGINS,
    SESSION_MAX_AGE, SESSION_IDLE_SECONDS, ANONYMOUS_MAX_AGE)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except ValueError:
        return False


def session_hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def read_session(token: str | None, db: Session, *, touch=False):
    if not token or len(token) > 128:
        return None
    session = db.get(BrowserSession, session_hash(token))
    now = datetime.utcnow()
    if (session is None or session.expires_at <= now
            or (now - session.last_seen_at).total_seconds() >= SESSION_IDLE_SECONDS):
        return None
    # Avoid a database write on every asset request or multiplayer heartbeat.
    if touch and (now - session.last_seen_at).total_seconds() >= 60:
        session.last_seen_at = now
        db.commit()
    return session


def issue_session(response: Response, db: Session, user_id=None):
    token = secrets.token_urlsafe(32)
    lifetime = SESSION_MAX_AGE if user_id is not None else ANONYMOUS_MAX_AGE
    now = datetime.utcnow()
    db.query(BrowserSession).filter(BrowserSession.expires_at <= now).delete(synchronize_session=False)
    session = BrowserSession(token_hash=session_hash(token), user_id=user_id,
        csrf_token=secrets.token_urlsafe(32), created_at=now, last_seen_at=now,
        expires_at=now + timedelta(seconds=lifetime))
    db.add(session)
    db.commit()
    response.set_cookie(COOKIE_NAME, token, max_age=lifetime, path='/',
                        secure=COOKIE_SECURE, httponly=True, samesite='lax')
    return session


def require_trusted_origin(origin: str | None):
    if origin not in ALLOWED_ORIGINS:
        raise HTTPException(status_code=403, detail='This website is not allowed to make this request.')


def protect_browser_request(request: HTTPConnection, db: Session = Depends(get_db)):
    """Protect every mutation, including login, registration, and multipart uploads."""
    if request.scope['type'] == 'websocket':
        return
    if request.method in ('GET', 'HEAD', 'OPTIONS'):
        return
    require_trusted_origin(request.headers.get('origin'))
    session = read_session(request.cookies.get(COOKIE_NAME), db)
    if session is None:
        raise HTTPException(status_code=401, detail='Your session expired. Please sign in again.')
    csrf = request.headers.get('x-csrf-token', '')
    if not secrets.compare_digest(csrf.encode('utf-8'), session.csrf_token.encode('utf-8')):
        raise HTTPException(status_code=403, detail='Session verification failed. Refresh the page and try again.')


def get_current_user(request: Request, db: Session = Depends(get_db)):
    session = read_session(request.cookies.get(COOKIE_NAME), db, touch=True)
    user = db.get(User, session.user_id) if session and session.user_id is not None else None
    if user is None:
        raise HTTPException(status_code=401, detail='Please sign in to continue.')
    return user


def verify_file_ownership(file_path: str, current_user: User, db: Session):
    """Raise 403 if the given file_path doesn't belong to current_user."""
    owned = db.query(UserFile).filter(
        UserFile.file_path == file_path,
        UserFile.user_id == current_user.id
    ).first()
    if not owned:
        raise HTTPException(status_code=403, detail="You don't have access to this file")
    try:
        user_file_path(owned.file_path, current_user.id)
    except ValueError:
        raise HTTPException(status_code=403, detail="You don't have access to this file")
    return owned
