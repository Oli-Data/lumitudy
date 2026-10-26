"""Run the existing API with isolated, persistent local-preview accounts/uploads."""
from pathlib import Path
import os
import sys

repo = Path(__file__).resolve().parents[2]
backend = repo / 'backend'
state = repo / 'frontend' / '.preview-data'
state.mkdir(mode=0o700, exist_ok=True)
# Explicit overrides prevent the preview from opening the deployed database.
os.environ['SESSION_COOKIE_SECURE'] = 'false'
os.environ['ALLOWED_ORIGINS'] = 'http://127.0.0.1:4178,http://localhost:4178,http://localhost:5173,http://127.0.0.1:5173'
os.environ['DATABASE_URL'] = f'sqlite:///{state / "lumitudy.db"}'
os.environ['UPLOAD_DIR'] = str(state / 'uploads')
sys.path.insert(0, str(backend))
os.chdir(backend)

if __name__ == '__main__':
    import uvicorn
    # Keep local account and document request metadata out of access logs.
    uvicorn.run('main:app', host='127.0.0.1', port=8000, access_log=False, log_level='warning')
