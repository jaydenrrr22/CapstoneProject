from datetime import datetime, timezone, timedelta

from backend.api.dependencies.auth import get_password_hash
from backend.api.dependencies.database import engine, Base, SessionLocal
from backend.api.models.transaction import Transaction
from backend.api.models.user import User

def seed_database():
    print("Initializing database setup...")

    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        if db.query(User).count() == 0:
            print("Inserting 3 demo users...")
            demo_users = [
                User(name = "Alice Smith", email = "alice@example.com",
                     hashed_password = get_password_hash("alice1234")),
                User(name = "Bob Johns", email = "bob@example.com",
                     hashed_password = get_password_hash("bob1234")),
                User(name = "Charlie Brown", email = "charlie@example.com",
                     hashed_password = get_password_hash("charlie1234"))
            ]
            db.add_all(demo_users)
            db.commit()
            print("3 demo users successfully inserted.")
        else:
            print("Users table already exists.")

        now = datetime.now(timezone.utc)
        if db.query(Transaction).count() == 0:
            print("Inserting demo transactions...")
            demo_transactions = [
                Transaction(cost=5.99, date=now, store_name="Target", category="Grocery", user_id=1),
                Transaction(cost=3.99, date=now - timedelta(days=1), store_name="Walmart", category="Grocery",
                            user_id=1),
                Transaction(cost=45.20, date=now - timedelta(days=3), store_name="Harris Teeter", category="Grocery",
                            user_id=1),
                Transaction(cost=35.00, date=now - timedelta(days=4), store_name="Shell", category="Transport",
                            user_id=1),
                Transaction(cost=29.99, date=now - timedelta(days=5), store_name="Amazon", category="Shopping",
                            user_id=1),
                Transaction(cost=4.50, date=now - timedelta(days=6), store_name="Starbucks", category="Restaurant",
                            user_id=1),
                Transaction(cost=85.00, date=now - timedelta(days=7), store_name="Duke Energy", category="Utilities",
                            user_id=1),
                Transaction(cost=10.99, date=now - timedelta(days=8), store_name="Spotify", category="Entertainment",
                            user_id=1),
                Transaction(cost=8.45, date=now - timedelta(days=10), store_name="Bojangles", category="Restaurant",
                            user_id=1),
                Transaction(cost=25.00, date=now - timedelta(days=12), store_name="AMC Theatres",
                            category="Entertainment", user_id=1),

                Transaction(cost=24.99, date=now, store_name="Lang Van", category="Restaurant", user_id=2),
                Transaction(cost=62.15, date=now - timedelta(days=2), store_name="Publix", category="Grocery",
                            user_id=2),
                Transaction(cost=40.00, date=now - timedelta(days=3), store_name="QuikTrip", category="Transport",
                            user_id=2),
                Transaction(cost=15.49, date=now - timedelta(days=5), store_name="Netflix", category="Entertainment",
                            user_id=2),
                Transaction(cost=120.00, date=now - timedelta(days=7), store_name="Best Buy", category="Shopping",
                            user_id=2),
                Transaction(cost=32.40, date=now - timedelta(days=8), store_name="Midwood Smokehouse",
                            category="Restaurant", user_id=2),
                Transaction(cost=55.30, date=now - timedelta(days=11), store_name="Trader Joe's", category="Grocery",
                            user_id=2),
                Transaction(cost=45.00, date=now - timedelta(days=14), store_name="Piedmont Natural Gas",
                            category="Utilities", user_id=2),
                Transaction(cost=99.00, date=now - timedelta(days=15), store_name="Apple Store", category="Shopping",
                            user_id=2),
                Transaction(cost=18.50, date=now - timedelta(days=16), store_name="Optimist Hall",
                            category="Restaurant", user_id=2),

                Transaction(cost=22.00, date=now - timedelta(days=1), store_name="Cabo Fish Taco",
                            category="Restaurant", user_id=3),
                Transaction(cost=38.90, date=now - timedelta(days=2), store_name="Food Lion", category="Grocery",
                            user_id=3),
                Transaction(cost=42.10, date=now - timedelta(days=5), store_name="Target", category="Shopping",
                            user_id=3),
                Transaction(cost=33.50, date=now - timedelta(days=6), store_name="Exxon", category="Transport",
                            user_id=3),
                Transaction(cost=60.00, date=now - timedelta(days=9), store_name="Charlotte Water",
                            category="Utilities", user_id=3),
                Transaction(cost=75.00, date=now - timedelta(days=12), store_name="Carowinds", category="Entertainment",
                            user_id=3),
                Transaction(cost=5.75, date=now - timedelta(days=13), store_name="Starbucks", category="Restaurant",
                            user_id=3),
                Transaction(cost=15.20, date=now - timedelta(days=18), store_name="Harris Teeter", category="Grocery",
                            user_id=3),
                Transaction(cost=150.00, date=now - timedelta(days=20), store_name="SouthPark Mall",
                            category="Shopping", user_id=3),
                Transaction(cost=12.50, date=now - timedelta(days=22), store_name="Amelie's French Bakery",
                            category="Restaurant", user_id=3),
            ]
            db.add_all(demo_transactions)
            db.commit()
            print("30 Demo transactions successfully inserted.")
        else:
            print("Transactions table already exists.")

    except Exception as e:
        print(f"An error occurred: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()