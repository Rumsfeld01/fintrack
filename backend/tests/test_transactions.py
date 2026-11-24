import pytest
import uuid
from datetime import datetime, timezone


@pytest.fixture
def portfolio(client, auth_headers):
    r = client.post("/api/v1/portfolios", json={
        "name": "Txn Test Portfolio",
        "client_name": "Test Client",
        "base_currency": "KES",
    }, headers=auth_headers)
    assert r.status_code == 201
    return r.json()


def _buy_payload(instrument: str, qty: str = "100", price: str = "14.50") -> dict:
    return {
        "instrument": instrument,
        "transaction_type": "BUY",
        "quantity": qty,
        "unit_price": price,
        "trade_date": datetime.now(timezone.utc).isoformat(),
    }


def test_buy_transaction(client, auth_headers, portfolio):
    pid = portfolio["id"]
    r = client.post(
        f"/api/v1/portfolios/{pid}/transactions",
        json=_buy_payload("SCOM"),
        headers=auth_headers,
    )
    assert r.status_code == 201
    data = r.json()
    assert data["instrument"] == "SCOM"
    assert data["transaction_type"] == "BUY"
    assert float(data["quantity"]) == 100.0
    assert float(data["unit_price"]) == 14.50
    assert float(data["total_value"]) == pytest.approx(1450.0)


def test_buy_then_sell(client, auth_headers, portfolio):
    pid = portfolio["id"]
    client.post(f"/api/v1/portfolios/{pid}/transactions",
                json=_buy_payload("KCB", "200", "28.00"), headers=auth_headers)

    r = client.post(f"/api/v1/portfolios/{pid}/transactions", json={
        "instrument": "KCB",
        "transaction_type": "SELL",
        "quantity": "50",
        "unit_price": "30.00",
        "trade_date": datetime.now(timezone.utc).isoformat(),
    }, headers=auth_headers)
    assert r.status_code == 201
    assert r.json()["transaction_type"] == "SELL"


def test_sell_exceeds_holding(client, auth_headers, portfolio):
    pid = portfolio["id"]
    client.post(f"/api/v1/portfolios/{pid}/transactions",
                json=_buy_payload("EQTY", "10", "40.00"), headers=auth_headers)

    r = client.post(f"/api/v1/portfolios/{pid}/transactions", json={
        "instrument": "EQTY",
        "transaction_type": "SELL",
        "quantity": "999",
        "unit_price": "42.00",
        "trade_date": datetime.now(timezone.utc).isoformat(),
    }, headers=auth_headers)
    assert r.status_code == 400
    assert "Insufficient" in r.json()["detail"]


def test_zero_quantity_rejected(client, auth_headers, portfolio):
    pid = portfolio["id"]
    r = client.post(f"/api/v1/portfolios/{pid}/transactions", json={
        "instrument": "SCOM",
        "transaction_type": "BUY",
        "quantity": "0",
        "unit_price": "14.50",
        "trade_date": datetime.now(timezone.utc).isoformat(),
    }, headers=auth_headers)
    assert r.status_code == 422


def test_negative_price_rejected(client, auth_headers, portfolio):
    pid = portfolio["id"]
    r = client.post(f"/api/v1/portfolios/{pid}/transactions", json={
        "instrument": "SCOM",
        "transaction_type": "BUY",
        "quantity": "100",
        "unit_price": "-5",
        "trade_date": datetime.now(timezone.utc).isoformat(),
    }, headers=auth_headers)
    assert r.status_code == 422


def test_list_transactions(client, auth_headers, portfolio):
    pid = portfolio["id"]
    client.post(f"/api/v1/portfolios/{pid}/transactions",
                json=_buy_payload("KCB"), headers=auth_headers)
    r = client.get(f"/api/v1/portfolios/{pid}/transactions", headers=auth_headers)
    assert r.status_code == 200
    assert isinstance(r.json(), list)
    assert len(r.json()) >= 1


def test_filter_transactions_by_instrument(client, auth_headers, portfolio):
    pid = portfolio["id"]
    client.post(f"/api/v1/portfolios/{pid}/transactions",
                json=_buy_payload("COOP"), headers=auth_headers)
    r = client.get(
        f"/api/v1/portfolios/{pid}/transactions?instrument=COOP",
        headers=auth_headers,
    )
    assert r.status_code == 200
    for txn in r.json():
        assert txn["instrument"] == "COOP"


def test_delete_transaction(client, auth_headers, portfolio):
    pid = portfolio["id"]
    r = client.post(f"/api/v1/portfolios/{pid}/transactions",
                    json=_buy_payload("BAMB", "500", "3.00"), headers=auth_headers)
    txn_id = r.json()["id"]
    r = client.delete(f"/api/v1/transactions/{txn_id}", headers=auth_headers)
    assert r.status_code == 204


def test_holdings_summary_after_buy(client, auth_headers, portfolio):
    pid = portfolio["id"]
    client.post(f"/api/v1/portfolios/{pid}/transactions",
                json=_buy_payload("EABL", "200", "130.00"), headers=auth_headers)
    r = client.get(f"/api/v1/portfolios/{pid}/summary", headers=auth_headers)
    assert r.status_code == 200
    data = r.json()
    eabl = next((h for h in data["holdings"] if h["instrument"] == "EABL"), None)
    assert eabl is not None
    assert float(eabl["quantity"]) == 200.0
    assert float(eabl["total_invested"]) == pytest.approx(26000.0)


def test_wrong_portfolio_blocked(client, auth_headers):
    r = client.get("/api/v1/portfolios/99999/transactions", headers=auth_headers)
    assert r.status_code == 404
