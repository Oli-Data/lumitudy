"""Explicit browser origins and secure-by-default session policy."""
import os
from urllib.parse import urlsplit

COOKIE_SECURE = os.getenv('SESSION_COOKIE_SECURE', 'true').lower() == 'true'
COOKIE_NAME = '__Host-lumitudy_session' if COOKIE_SECURE else 'lumitudy_dev_session'
ALLOWED_ORIGINS = [origin.strip().rstrip('/') for origin in os.getenv(
    'ALLOWED_ORIGINS', 'https://lumitudy.com,https://www.lumitudy.com'
).split(',') if origin.strip()]
for origin in ALLOWED_ORIGINS:
    parsed = urlsplit(origin)
    if (parsed.scheme not in ('http', 'https') or not parsed.hostname
            or parsed.path or parsed.query or parsed.fragment or parsed.username
            or '*' in origin):
        raise RuntimeError('ALLOWED_ORIGINS must contain exact HTTP(S) origins.')
    if not COOKIE_SECURE and parsed.hostname not in ('localhost', '127.0.0.1', '::1'):
        raise RuntimeError('Insecure session cookies are only allowed for loopback development origins.')
SESSION_MAX_AGE = 7 * 24 * 60 * 60
SESSION_IDLE_SECONDS = 24 * 60 * 60
ANONYMOUS_MAX_AGE = 30 * 60
