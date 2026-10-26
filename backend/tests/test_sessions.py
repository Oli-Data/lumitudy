"""Security boundaries exercised through HTTP and actual WebSocket handshakes."""
from datetime import datetime, timedelta
from fastapi import Response
from starlette.websockets import WebSocketDisconnect
import pytest
from database import BrowserSession
from main import app
from services import auth
from services.auth import get_current_user, session_hash
from services.session_config import COOKIE_NAME
from game_manager import game_manager


def signup(api):
    client, db, _, _ = api
    app.dependency_overrides.pop(get_current_user, None)
    response = client.post('/auth/register', json={
        'email': 'session@example.test', 'username': 'reader', 'password': 'Local-test-password'})
    assert response.status_code == 200
    client.headers['X-CSRF-Token'] = response.json()['csrf_token']
    return client, db, response


def test_cookie_session_rotation_hashing_and_logout_replay(api):
    client, db, _, _ = api
    anonymous = client.cookies.get(COOKIE_NAME)
    client, db, response = signup(api)
    cookie = client.cookies.get(COOKIE_NAME)
    assert cookie != anonymous
    assert 'access_token' not in response.json()
    assert 'httponly' in response.headers['set-cookie'].lower()
    assert 'samesite=lax' in response.headers['set-cookie'].lower()
    assert 'domain=' not in response.headers['set-cookie'].lower()
    assert response.headers['cache-control'] == 'no-store'
    assert db.get(BrowserSession, session_hash(anonymous)) is None
    row = db.get(BrowserSession, session_hash(cookie))
    assert row and row.token_hash != cookie
    replay = {'Cookie': f'{COOKIE_NAME}={cookie}', 'X-CSRF-Token': row.csrf_token}
    assert client.get('/auth/me').json()['username'] == 'reader'
    assert client.post('/auth/logout').status_code == 204
    assert not client.cookies.get(COOKIE_NAME)
    assert client.get('/auth/me', headers=replay).status_code == 401
    assert client.post('/sets/save', headers=replay, json={}).status_code == 401


def test_login_rotates_session_and_preserves_account(api):
    client, db, _ = signup(api)
    old = client.cookies.get(COOKIE_NAME)
    old_csrf = client.headers['X-CSRF-Token']
    login = client.post('/auth/login', json={'email':'session@example.test','password':'Local-test-password'})
    assert login.status_code == 200
    assert login.json()['csrf_token'] != old_csrf
    assert client.cookies.get(COOKIE_NAME) != old
    assert db.get(BrowserSession, session_hash(old)) is None
    assert client.get('/auth/session').json()['user']['username'] == 'reader'
    assert client.get('/auth/me', headers={'Cookie':f'{COOKIE_NAME}={old}'}).status_code == 401


@pytest.mark.parametrize('headers', [
    {'Origin':'https://attacker.example'}, {'Origin':'null'}, {'Origin':''},
    {'Origin':'http://localhost:5173.attacker.example'},
    {'X-CSRF-Token':''}, {'X-CSRF-Token':'wrong'},
])
def test_mutations_reject_untrusted_origins_and_missing_csrf(api, headers):
    client, _, _ = signup(api)
    for path, body in [('/auth/logout', None),('/auth/login', {'email':'session@example.test','password':'Local-test-password'})]:
        assert client.post(path, headers=headers, json=body).status_code == 403
    assert client.get('/auth/me').status_code == 200


def test_signup_and_upload_are_csrf_protected(api):
    client, _, _, _ = api
    assert client.post('/auth/register', headers={'X-CSRF-Token':''}, json={}).status_code == 403
    assert client.post('/upload/', headers={'X-CSRF-Token':''}, files={'file':('x.pdf',b'fake','application/pdf')}).status_code == 403


@pytest.mark.parametrize('field,age', [('expires_at',timedelta(seconds=1)),('last_seen_at',timedelta(hours=25))])
def test_absolute_and_idle_expiry(api, field, age):
    client, db, _ = signup(api)
    row = db.get(BrowserSession, session_hash(client.cookies.get(COOKIE_NAME)))
    setattr(row, field, datetime.utcnow() - age)
    db.commit()
    assert client.get('/auth/me').status_code == 401
    bootstrap = client.get('/auth/session')
    assert bootstrap.json()['user'] is None


def test_production_cookie_is_secure_host_only(api, monkeypatch):
    _, db, user, _ = api
    monkeypatch.setattr(auth, 'COOKIE_SECURE', True)
    monkeypatch.setattr(auth, 'COOKIE_NAME', '__Host-lumitudy_session')
    response = Response()
    auth.issue_session(response, db, user.id)
    cookie = response.headers['set-cookie']
    assert cookie.startswith('__Host-lumitudy_session=')
    assert 'Secure' in cookie and 'HttpOnly' in cookie and 'Path=/' in cookie
    assert 'Domain=' not in cookie


@pytest.mark.parametrize('headers', [{'Origin':'https://attacker.example'},{'Origin':''},{'Cookie':''}])
def test_websocket_rejects_foreign_origin_or_missing_cookie(api, headers):
    client, _, _ = signup(api)
    code = game_manager.create_room('reader', [])
    with pytest.raises(WebSocketDisconnect) as error:
        with client.websocket_connect(f'/game/ws/{code}/reader', headers=headers):
            pass
    assert error.value.code == 1008


def test_old_bearer_and_url_token_are_not_authentication(api):
    client, _, _ = signup(api)
    cookie = client.cookies.get(COOKIE_NAME)
    assert client.get('/auth/me', headers={'Cookie':'','Authorization':f'Bearer {cookie}'}).status_code == 401
    with pytest.raises(WebSocketDisconnect):
        with client.websocket_connect(f'/game/ws/NONE/reader?token={cookie}', headers={'Cookie':''}):
            pass


def test_logout_closes_an_existing_socket(api):
    client, _, _ = signup(api)
    code = game_manager.create_room('reader', [])
    with client.websocket_connect(f'/game/ws/{code}/reader') as socket:
        assert socket.receive_json()['type'] == 'player_joined'
        assert client.post('/auth/logout').status_code == 204
        with pytest.raises(WebSocketDisconnect) as error:
            socket.receive_json()
        assert error.value.code == 1008


def test_expired_socket_rejects_messages(api):
    client, db, _ = signup(api)
    code = game_manager.create_room('reader', [])
    with client.websocket_connect(f'/game/ws/{code}/reader') as socket:
        socket.receive_json()
        row = db.get(BrowserSession, session_hash(client.cookies.get(COOKIE_NAME)))
        row.expires_at = datetime.utcnow() - timedelta(seconds=1)
        db.commit()
        socket.send_json({'type':'ping'})
        with pytest.raises(WebSocketDisconnect):
            socket.receive_json()


def test_websocket_cannot_impersonate_another_username(api):
    client, _, _ = signup(api)
    with pytest.raises(WebSocketDisconnect):
        with client.websocket_connect('/game/ws/NONE/owner'):
            pass


def test_cors_allows_only_configured_origin_and_csrf_header(api):
    client, _, _, _ = api
    headers = {'Origin':'http://localhost:5173','Access-Control-Request-Method':'POST',
               'Access-Control-Request-Headers':'content-type,x-csrf-token'}
    response = client.options('/auth/login',headers=headers)
    assert response.status_code == 200
    assert response.headers['access-control-allow-origin'] == headers['Origin']
    assert response.headers['access-control-allow-credentials'] == 'true'
    headers['Origin'] = 'https://attacker.example'
    assert 'access-control-allow-origin' not in client.options('/auth/login',headers=headers).headers


def test_idle_socket_observes_database_revocation_without_a_message(api, monkeypatch):
    from routers import game
    monkeypatch.setattr(game, 'SESSION_RECHECK_SECONDS', 0.05)
    client, db, _ = signup(api)
    code = game_manager.create_room('reader', [])
    with client.websocket_connect(f'/game/ws/{code}/reader') as socket:
        socket.receive_json()
        row = db.get(BrowserSession, session_hash(client.cookies.get(COOKIE_NAME)))
        db.delete(row)
        db.commit()
        with pytest.raises(WebSocketDisconnect) as error:
            socket.receive_json()
        assert error.value.code == 1008
