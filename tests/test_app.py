from fastapi.testclient import TestClient

from src.app import app


def test_signup_unregister_flow():
    client = TestClient(app)

    # Fetch activities (basic smoke test)
    r = client.get("/activities")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, dict)
    assert "Chess Club" in data

    email = "tester_flow@example.com"
    activity = "Chess Club"

    # Ensure signing up works
    r = client.post(f"/activities/{activity}/signup?email={email}")
    assert r.status_code == 200
    assert email in r.json().get("message", "")

    # Fetch activities and confirm participant present
    r = client.get("/activities")
    assert r.status_code == 200
    participants = r.json()[activity]["participants"]
    assert email in participants

    # Duplicate signup returns 400
    r = client.post(f"/activities/{activity}/signup?email={email}")
    assert r.status_code == 400

    # Unregister the participant
    r = client.delete(f"/activities/{activity}/participants?email={email}")
    assert r.status_code == 200

    # Ensure participant removed
    r = client.get("/activities")
    assert r.status_code == 200
    participants = r.json()[activity]["participants"]
    assert email not in participants

    # Unregister again should return 404
    r = client.delete(f"/activities/{activity}/participants?email={email}")
    assert r.status_code == 404
