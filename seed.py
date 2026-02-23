from backend.api.dependencies.auth import get_password_hash
from backend.api.dependencies.database import engine, Base, SessionLocal
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


        users = db.query(User).all()
    except Exception as e:
        print(f"An error occurred: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()