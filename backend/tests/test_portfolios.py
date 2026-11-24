import pytest

PORTFOLIO_PAYLOAD = {
    "name": "Test Portfolio",
    "client_name": "Test Client Ltd",
    "base_currency": "KES",
}


@pytest.fixture
def portfolio(client, auth_headers):
    r = client.post("/api/v1/portfolios", json=PORTFOLIO_PAYLOAD, headers=auth_headers)
    assert r.status_code == 201
    return r.json()


def test_create_portfolio(client, auth_headers):
    r = client.post("/api/v1/portfolios", json={
        "name": "My Portfolio",
        "client_name": "Client A",
        "base_currency": "USD",
    }, headers=auth_headers)
    assert r.status_code == 201
    data = r.json()
    assert data["name"] == "My Portfolio"
    assert data["client_name"] == "Client A"
    assert data["base_currency"] == "USD"


def test_create_portfolio_missing_client_name(client, auth_headers):
    r = client.post("/api/v1/portfolios", json={
        "name": "No Client",
    }, headers=auth_headers)
    assert r.status_code == 422


def test_list_portfolios(client, auth_headers, portfolio):
    r = client.get("/api/v1/portfolios", headers=auth_headers)
    assert r.status_code == 200
    assert isinstance(r.json(), list)
    assert any(p["id"] == portfolio["id"] for p in r.json())


def test_get_portfolio(client, auth_headers, portfolio):
    r = client.get(f"/api/v1/portfolios/{portfolio['id']}", headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["id"] == portfolio["id"]
    assert r.json()["client_name"] == "Test Client Ltd"


def test_update_portfolio(client, auth_headers, portfolio):
    r = client.put(
        f"/api/v1/portfolios/{portfolio['id']}",
        json={"name": "Updated", "client_name": "Updated Client"},
        headers=auth_headers,
    )
    assert r.status_code == 200
    assert r.json()["name"] == "Updated"
    assert r.json()["client_name"] == "Updated Client"


def test_portfolio_not_found(client, auth_headers):
    r = client.get("/api/v1/portfolios/99999", headers=auth_headers)
    assert r.status_code == 404


def test_delete_portfolio(client, auth_headers):
    r = client.post("/api/v1/portfolios", json={
        "name": "To Delete", "client_name": "Client Z",
    }, headers=auth_headers)
    pid = r.json()["id"]
    r = client.delete(f"/api/v1/portfolios/{pid}", headers=auth_headers)
    assert r.status_code == 204
    assert client.get(f"/api/v1/portfolios/{pid}", headers=auth_headers).status_code == 404


def test_portfolio_requires_auth(client):
    r = client.get("/api/v1/portfolios")
    assert r.status_code == 403


def test_portfolio_summary_empty(client, auth_headers, portfolio):
    r = client.get(f"/api/v1/portfolios/{portfolio['id']}/summary", headers=auth_headers)
    assert r.status_code == 200
    data = r.json()
    assert data["portfolio_id"] == portfolio["id"]
    assert data["holdings"] == []
    assert float(data["total_invested"]) == 0
