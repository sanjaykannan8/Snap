import json

import pytest
from starlette.testclient import TestClient

import server


def test_mcp_authentication_tool_and_revocation(monkeypatch):
    allowed = {"snap_test": "alice@example.com"}
    monkeypatch.setattr(server, "verify_api_key", lambda key: allowed.get(key))
    monkeypatch.setattr(server, "list_skills", lambda email: [{"id": "one", "name": "Design", "description": "Design help", "objectKey": "alice/skill.md"}] if email == "alice@example.com" else [])
    monkeypatch.setattr(server, "get_skill_url", lambda key: f"https://storage.example/{key}?signed=1")

    async def match(problem, skills):
        assert problem == "design a page"
        return skills[0]
    monkeypatch.setattr(server, "select_skill", match)

    headers = {"x-snap-api-key": "snap_test", "accept": "application/json, text/event-stream"}
    def rpc(client, method, params):
        return client.post("/mcp", headers=headers, json={"jsonrpc": "2.0", "id": 1, "method": method, "params": params})

    with TestClient(server.app) as client:
        assert client.post("/mcp", json={}).status_code == 401
        init = rpc(client, "initialize", {"protocolVersion": "2025-06-18", "capabilities": {}, "clientInfo": {"name": "test", "version": "1"}})
        assert init.status_code == 200
        tools = rpc(client, "tools/list", {}).json()["result"]["tools"]
        assert [tool["name"] for tool in tools] == ["get_skill"]
        result = rpc(client, "tools/call", {"name": "get_skill", "arguments": {"problem": "design a page"}}).json()["result"]
        assert json.loads(result["content"][0]["text"])["url"].startswith("https://storage.example/alice/")
        allowed.clear()
        assert rpc(client, "tools/list", {}).status_code == 401


@pytest.mark.asyncio
async def test_empty_library_needs_no_cloudflare():
    assert await server.select_skill("anything", []) is None


def test_verify_key_uses_hash_and_consistent_read(monkeypatch):
    class Table:
        def get_item(self, **kwargs):
            assert kwargs["ConsistentRead"] is True
            assert kwargs["Key"]["PK"] == "APIKEY#" + server.hashlib.sha256(key.encode()).hexdigest()
            return {"Item": {"email": "owner@example.com"}}
    key = "snap_" + "a" * 43
    monkeypatch.setattr(server, "dynamodb_table", lambda: Table())
    assert server.verify_api_key(key) == "owner@example.com"
    assert server.verify_api_key("invalid") is None
