import pytest


def test_register_success(client):
    r = client.post("/api/v1/auth/register", json={
        "email": "newuser@fintrack.io",
        "full_name": "New User",
        "password": "Password123",
    })
    assert r.status_code == 201
    data = r.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "newuser@fintrack.io"


def test_register_duplicate_email(client):
    payload = {"email": "dup@fintrack.io", "full_name": "Dup", "password": "Password123"}
    client.post("/api/v1/auth/register", json=payload)
    r = client.post("/api/v1/auth/register", json=payload)
    assert r.status_code == 409


def test_register_weak_password(client):
    r = client.post("/api/v1/auth/register", json={
        "email": "weak@fintrack.io",
        "full_name": "Weak",
        "password": "short",
    })
    assert r.status_code == 422


def test_login_success(client, registered_user):
    r = client.post("/api/v1/auth/login", json={
        "email": "test@fintrack.io",
        "password": "TestPass123",
    })
    assert r.status_code == 200
    assert "access_token" in r.json()


def test_login_wrong_password(client, registered_user):
    r = client.post("/api/v1/auth/login", json={
        "email": "test@fintrack.io",
        "password": "wrongpassword",
    })
    assert r.status_code == 401


def test_login_nonexistent_user(client):
    r = client.post("/api/v1/auth/login", json={
        "email": "ghost@fintrack.io",
        "password": "Password123",
    })
    assert r.status_code == 401


def test_get_me(client, auth_headers):
    r = client.get("/api/v1/auth/me", headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["email"] == "test@fintrack.io"


def test_get_me_no_token(client):
    r = client.get("/api/v1/auth/me")
    assert r.status_code == 403
