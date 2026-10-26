"""Exercise the installed Anthropic SDK's wire format without paid requests."""

import json

import httpx
import pytest

from services import ai


@pytest.mark.parametrize("override", [None, "claude-sonnet-5-5", "claude-sonnet-4-5"])
@pytest.mark.parametrize("exam", [False, True])
def test_generation_model_and_sdk_request(monkeypatch, override, exam):
    if override is None:
        monkeypatch.delenv("ANTHROPIC_MODEL", raising=False)
    else:
        monkeypatch.setenv("ANTHROPIC_MODEL", override)
    expected_model = override or "claude-sonnet-5-5"
    item = (
        {"question": "What attracts masses?", "options": ["Gravity", "Light", "Heat", "Sound"],
         "correct_index": 0}
        if exam else
        {"question": "What attracts masses?", "answer": "Gravity", "source_id": 1}
    )
    requests = []

    def respond(request):
        requests.append(json.loads(request.content))
        assert request.url.path == "/v1/messages"
        return httpx.Response(200, json={
            "id": "msg_model_test", "type": "message", "role": "assistant",
            "model": expected_model, "stop_reason": "end_turn", "stop_sequence": None,
            "content": [{"type": "text", "text": json.dumps([item])}],
            "usage": {"input_tokens": 20, "output_tokens": 40},
        })

    real_client = ai.anthropic.Anthropic
    monkeypatch.setattr(ai.anthropic, "Anthropic", lambda **kwargs: real_client(
        **kwargs, http_client=httpx.Client(transport=httpx.MockTransport(respond)),
    ))
    generate = ai.generate_exam if exam else ai.generate_flashcards
    result = generate("Gravity attracts masses.", 1)
    assert len(requests) == 1
    body = requests[0]
    assert body["model"] == expected_model
    assert body["max_tokens"] == 1400
    if expected_model == "claude-sonnet-5-5":
        assert body["thinking"] == {"type": "between_tools"}
        assert body["output_config"] == {"effort": "high"}
    else:
        assert "thinking" not in body and "output_config" not in body
    assert not {"temperature", "top_p", "top_k", "tools", "tool_choice"} & body.keys()
    if exam:
        assert result == [item]
    else:
        assert result == [{"question": item["question"], "answer": "Gravity",
                           "source_quote": "Gravity attracts masses."}]
