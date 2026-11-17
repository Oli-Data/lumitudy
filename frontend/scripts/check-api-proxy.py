"""Verify the Next rewrite against isolated local FastAPI accounts; no model calls."""
import io
import json
import uuid
import sys
from urllib.parse import urlsplit
import httpx
from docx import Document
from websockets.sync.client import connect

base = (sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:3000').rstrip('/')
parsed = urlsplit(base)
if parsed.scheme != 'http' or parsed.hostname not in ('localhost', '127.0.0.1', '::1') or parsed.path or parsed.query or parsed.fragment or parsed.username:
    raise SystemExit('Use only an isolated loopback Next.js preview with scripts/preview-api.py.')
with httpx.Client(base_url=base, headers={'Origin': base}, timeout=30, trust_env=False) as client:
    boot = client.get('/api/auth/session')
    boot.raise_for_status()
    csrf = boot.json()['csrf_token']
    assert 'httponly' in boot.headers['set-cookie'].lower()
    client.headers['X-CSRF-Token'] = csrf
    assert client.post('/api/auth/logout', headers={'X-CSRF-Token': 'wrong'}).status_code == 403
    suffix = uuid.uuid4().hex[:10]
    username = f'migration-{suffix}'
    created = client.post('/api/auth/register', json={
        'email': f'{username}@example.test', 'username': username, 'password': 'local-migration-test-only'})
    created.raise_for_status()
    client.headers['X-CSRF-Token'] = created.json()['csrf_token']
    assert client.get('/api/auth/session').json()['user']['username'] == username
    book = Document()
    book.add_heading('Chapter 1: Next migration test', level=1)
    book.add_paragraph('The median is the middle value in sorted data. A histogram groups values into intervals.')
    payload = io.BytesIO()
    book.save(payload)
    uploaded = client.post('/api/upload/', files={
        'file': ('Migration fixture.docx', payload.getvalue(), 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')})
    uploaded.raise_for_status()
    books = client.get('/api/upload/files')
    books.raise_for_status()
    assert len(books.json()) == 1
    assert books.json()[0]['chapters']
    cookies = '; '.join(f'{cookie.name}={cookie.value}' for cookie in client.cookies.jar)
    with connect(f'ws://{parsed.netloc}/api/game/ws/NOSUCH/{username}', origin=base,
                 additional_headers={'Cookie': cookies}, open_timeout=15, proxy=None) as socket:
        message = json.loads(socket.recv(timeout=15))
        assert message == {'type': 'error', 'message': 'Game not found'}
    assert client.delete(f"/api/upload/files/{books.json()[0]['id']}").status_code == 200
    assert client.post('/api/auth/logout').status_code == 204
    assert client.get('/api/auth/me').status_code == 401
print('Next HTTP/WebSocket forwarding: cookie + CSRF bootstrap, registration, session restore, DOCX upload/library, authenticated game handshake, deletion, and logout passed.')
