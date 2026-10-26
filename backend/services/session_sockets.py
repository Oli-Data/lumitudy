"""Wake local sockets immediately on logout; SQL checks cover other processes."""
import asyncio
from collections import defaultdict

listeners: dict[str, set[asyncio.Event]] = defaultdict(set)


def watch_session(token_hash):
    event = asyncio.Event()
    listeners[token_hash].add(event)
    return event


def unwatch_session(token_hash, event):
    listeners[token_hash].discard(event)
    if not listeners[token_hash]:
        listeners.pop(token_hash, None)


def notify_revoked(token_hash):
    for event in tuple(listeners.get(token_hash, ())):
        event.set()
