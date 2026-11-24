"""
Seed script: creates demo analyst and two sample portfolios with East African instruments.
Run from backend/ directory: python seed.py
"""
import sys
import os
from decimal import Decimal
from datetime import datetime, timezone, timedelta

sys.path.insert(0, os.path.dirname(__file__))

from app.db.base import SessionLocal, engine, Base
from app.models import User, Asset, Portfolio, PortfolioHolding, Transaction
from app.models.portfolio import BaseCurrency
from app.models.transaction import TransactionType
from app.models.asset import AssetCategory
from app.core.security import hash_password

Base.metadata.create_all(bind=engine)


def seed():
    db = SessionLocal()
    try:
        # ── Demo analyst ──────────────────────────────────────────────────
        demo_email = "demo@fintrack.io"
        existing = db.query(User).filter(User.email == demo_email).first()
        if existing:
            print("Re-seeding: clearing demo user data…")
            db.query(Transaction).filter(
                Transaction.portfolio_id.in_(
                    db.query(Portfolio.id).filter(Portfolio.owner_id == existing.id)
                )
            ).delete(synchronize_session=False)
            db.query(PortfolioHolding).filter(
                PortfolioHolding.portfolio_id.in_(
                    db.query(Portfolio.id).filter(Portfolio.owner_id == existing.id)
                )
            ).delete(synchronize_session=False)
            db.query(Portfolio).filter(Portfolio.owner_id == existing.id).delete()
            db.delete(existing)
            db.commit()

        demo_user = User(
            email=demo_email,
            full_name="Demo Analyst",
            hashed_password=hash_password("Demo1234!"),
            is_demo=True,
        )
        db.add(demo_user)
        db.flush()

        # ── Asset catalogue (NSE + Treasury instruments) ──────────────────
        assets_data = [
            ("SCOM",      "Safaricom PLC",                   AssetCategory.STOCK,     "14.50"),
            ("KCB",       "KCB Group PLC",                   AssetCategory.STOCK,     "28.80"),
            ("EQTY",      "Equity Group Holdings",           AssetCategory.STOCK,     "42.00"),
            ("COOP",      "Co-operative Bank of Kenya",      AssetCategory.STOCK,     "12.75"),
            ("BAMB",      "Bamburi Cement PLC",              AssetCategory.STOCK,      "3.20"),
            ("EABL",      "East African Breweries",          AssetCategory.STOCK,    "140.00"),
            ("T-BILL-91", "Kenya 91-Day Treasury Bill",      AssetCategory.BOND,       "98.50"),
            ("T-BILL-182","Kenya 182-Day Treasury Bill",     AssetCategory.BOND,       "97.20"),
            ("T-BOND-10", "Kenya 10-Year Treasury Bond",     AssetCategory.BOND,       "95.00"),
            ("AAPL",      "Apple Inc.",                      AssetCategory.STOCK,    "182.50"),
            ("MSFT",      "Microsoft Corporation",           AssetCategory.STOCK,    "415.20"),
            ("SPYI",      "S&P 500 ETF",                     AssetCategory.ETF,       "528.30"),
        ]

        for symbol, name, category, price in assets_data:
            existing_asset = db.query(Asset).filter(Asset.symbol == symbol).first()
            if existing_asset:
                existing_asset.current_price = Decimal(price)
            else:
                db.add(Asset(
                    symbol=symbol,
                    name=name,
                    category=category,
                    current_price=Decimal(price),
                    currency="KES" if symbol not in ("AAPL", "MSFT", "SPYI") else "USD",
                ))

        db.flush()

        # ── Portfolios ────────────────────────────────────────────────────
        nse_portfolio = Portfolio(
            name="NSE Equity Portfolio",
            client_name="Acme Pension Fund",
            base_currency=BaseCurrency.KES,
            description="Nairobi Securities Exchange blue-chip equities",
            owner_id=demo_user.id,
        )
        tbill_portfolio = Portfolio(
            name="Fixed Income Portfolio",
            client_name="Acme Pension Fund",
            base_currency=BaseCurrency.KES,
            description="Kenya government Treasury Bills and Bonds",
            owner_id=demo_user.id,
        )
        db.add(nse_portfolio)
        db.add(tbill_portfolio)
        db.flush()

        # ── Transactions ──────────────────────────────────────────────────
        now = datetime.now(timezone.utc)

        def days_ago(n: int) -> datetime:
            return now - timedelta(days=n)

        txns = [
            # NSE portfolio
            (nse_portfolio.id,   "SCOM",  TransactionType.BUY,  "5000", "13.50", days_ago(28)),
            (nse_portfolio.id,   "KCB",   TransactionType.BUY,  "2000", "26.00", days_ago(26)),
            (nse_portfolio.id,   "EQTY",  TransactionType.BUY,  "1000", "38.00", days_ago(24)),
            (nse_portfolio.id,   "COOP",  TransactionType.BUY,  "3000", "11.80", days_ago(22)),
            (nse_portfolio.id,   "EABL",  TransactionType.BUY,   "500","130.00", days_ago(20)),
            (nse_portfolio.id,   "SCOM",  TransactionType.BUY,  "2000", "14.00", days_ago(15)),
            (nse_portfolio.id,   "KCB",   TransactionType.SELL,  "500", "29.50", days_ago(10)),
            (nse_portfolio.id,   "BAMB",  TransactionType.BUY,  "4000",  "3.00", days_ago(8)),
            (nse_portfolio.id,   "EQTY",  TransactionType.BUY,   "500", "40.00", days_ago(5)),
            # Fixed income portfolio
            (tbill_portfolio.id, "T-BILL-91",  TransactionType.BUY, "100", "98.00", days_ago(27)),
            (tbill_portfolio.id, "T-BILL-182", TransactionType.BUY,  "50", "96.80", days_ago(25)),
            (tbill_portfolio.id, "T-BOND-10",  TransactionType.BUY,  "30", "94.00", days_ago(20)),
            (tbill_portfolio.id, "T-BILL-91",  TransactionType.BUY,  "50", "98.30", days_ago(12)),
            (tbill_portfolio.id, "T-BILL-91",  TransactionType.SELL, "20", "98.60", days_ago(5)),
        ]

        for pid, instrument, txn_type, qty_str, price_str, trade_date in txns:
            qty = Decimal(qty_str)
            price = Decimal(price_str)
            total = qty * price

            txn = Transaction(
                portfolio_id=pid,
                instrument=instrument,
                transaction_type=txn_type,
                quantity=qty,
                unit_price=price,
                total_value=total,
                trade_date=trade_date,
            )
            db.add(txn)

            # Maintain holdings
            holding = db.query(PortfolioHolding).filter(
                PortfolioHolding.portfolio_id == pid,
                PortfolioHolding.instrument == instrument,
            ).first()

            if txn_type == TransactionType.BUY:
                if holding:
                    old_qty = Decimal(str(holding.quantity))
                    old_avg = Decimal(str(holding.average_buy_price))
                    new_qty = old_qty + qty
                    holding.average_buy_price = (old_qty * old_avg + qty * price) / new_qty
                    holding.quantity = new_qty
                else:
                    holding = PortfolioHolding(
                        portfolio_id=pid,
                        instrument=instrument,
                        quantity=qty,
                        average_buy_price=price,
                    )
                    db.add(holding)
            elif txn_type == TransactionType.SELL and holding:
                holding.quantity = Decimal(str(holding.quantity)) - qty
                if holding.quantity <= 0:
                    db.delete(holding)

        db.commit()
        print("✓ Seed complete.")
        print("  Demo login  : demo@fintrack.io / Demo1234!")
        print("  Portfolios  : NSE Equity Portfolio, Fixed Income Portfolio")
        print("  Client      : Acme Pension Fund (KES)")
        print("  Instruments : SCOM, KCB, EQTY, COOP, BAMB, EABL, T-BILL-91, T-BILL-182, T-BOND-10")

    except Exception as e:
        db.rollback()
        print(f"✗ Seed failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
