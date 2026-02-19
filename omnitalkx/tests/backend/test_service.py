import json
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from omnitalkx.backend.service import service_openrouter as svc


def test_build_payload_injects_system_message():
    payload = {
        "messages": [{"role": "user", "content": "hello"}],
    }
    normalized = svc.build_payload("openai", payload)
    assert normalized["stream"] is True
    assert normalized["model"] == svc.PROVIDERS["openai"]["id"]
    assert normalized["messages"][0]["role"] == "system"
    assert "content" in normalized["messages"][0]


def test_extract_delta_text_handles_message_content():
    data = {"choices": [{"message": {"content": "hi"}}]}
    assert svc.extract_delta_text(data) == "hi"


def test_extract_delta_text_handles_delta_content():
    data = {"choices": [{"delta": {"content": "stream"}}]}
    assert svc.extract_delta_text(data) == "stream"


def test_normalize_error_from_json():
    payload = {"error": {"message": "bad request"}}
    raw = json.dumps(payload)
    assert svc.normalize_error(raw) == "bad request"


def test_get_random_providers_subset():
    providers = svc.get_random_providers(5)
    assert 0 < len(providers) <= 5
    assert set(providers).issubset(set(svc.PROVIDERS.keys()))
