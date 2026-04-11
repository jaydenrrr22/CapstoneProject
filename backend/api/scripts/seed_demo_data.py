from __future__ import annotations

import os
import re
import sqlite3
import sys
from pathlib import Path
from typing import Literal
from passlib.context import CryptContext
from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).resolve().parents[3]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

load_dotenv(PROJECT_ROOT / ".env")

SQL_SOURCE_PATH = PROJECT_ROOT / "data_analysis" / "realistic_data.sql"
DEMO_USER_ID = 999
DEMO_EMAIL = "demo@trace.com"
DEMO_NAME = "Demo User"
DEMO_PASSWORD = "demo-mode"
PWD_CONTEXT = CryptContext(schemes=["bcrypt"], deprecated="auto")


def detect_database_type() -> Literal["mysql", "sqlite"]:
    db_host = os.getenv("DB_HOST", "").strip()
    db_name = os.getenv("DB_NAME", "").strip()
    db_user = os.getenv("DB_USER", "").strip()
    db_password = os.getenv("DB_PASSWORD", "").strip()

    if all([db_host, db_name, db_user, db_password]):
        return "mysql"

    return "sqlite"


def load_source_rows() -> list[tuple[float, float, str, str, str]]:
    if not SQL_SOURCE_PATH.exists():
        raise FileNotFoundError(f"SQL dataset file not found: {SQL_SOURCE_PATH}")

    content = SQL_SOURCE_PATH.read_text(encoding="utf-8")
    raw_inserts = re.findall(
        r"\(\s*"
        r"([-+]?[0-9]*\.?[0-9]+)\s*,\s*"
        r"([-+]?[0-9]*\.?[0-9]+)\s*,\s*"
        r"'((?:''|[^'])*)'\s*,\s*"
        r"'((?:''|[^'])*)'\s*,\s*"
        r"'(\d{4}-\d{2}-\d{2})'\s*"
        r"\)",
        content,
        flags=re.IGNORECASE,
    )

    if not raw_inserts:
        raise RuntimeError("No transaction tuples found in realistic_data.sql")

    rows: list[tuple[float, float, str, str, str]] = []
    for source_id, cost, category, store_name, tx_date in raw_inserts:
        rows.append(
            (
                float(source_id),
                float(cost),
                category.replace("''", "'"),
                store_name.replace("''", "'"),
                tx_date,
            )
        )

    return rows


def ensure_schema_mysql(cursor) -> None:
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS customer_data (
            id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            source_id FLOAT,
            cost FLOAT NOT NULL,
            category VARCHAR(255) NOT NULL,
            store_name VARCHAR(255) NOT NULL,
            transaction_date DATE NOT NULL,
            user_id INT NOT NULL,
            INDEX idx_customer_data_user_id (user_id)
        )
        """
    )

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS `transaction` (
            id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            cost FLOAT NOT NULL,
            date DATE NOT NULL,
            store_name VARCHAR(255) NOT NULL,
            category VARCHAR(255) NOT NULL,
            user_id INT NOT NULL,
            INDEX idx_transaction_user_id (user_id)
        )
        """
    )

    required_columns = {
        "source_id": "FLOAT NULL",
        "cost": "FLOAT NOT NULL DEFAULT 0",
        "category": "VARCHAR(255) NOT NULL DEFAULT ''",
        "store_name": "VARCHAR(255) NOT NULL DEFAULT ''",
        "transaction_date": "DATE NOT NULL DEFAULT '1970-01-01'",
        "user_id": "INT NOT NULL DEFAULT 999",
    }

    for column_name, column_definition in required_columns.items():
        cursor.execute("SHOW COLUMNS FROM customer_data LIKE %s", (column_name,))
        if cursor.fetchone() is None:
            cursor.execute(
                f"ALTER TABLE customer_data ADD COLUMN {column_name} {column_definition}"
            )


def ensure_schema_sqlite(cursor) -> None:
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS customer_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source_id REAL,
            cost REAL NOT NULL,
            category TEXT NOT NULL,
            store_name TEXT NOT NULL,
            transaction_date TEXT NOT NULL,
            user_id INTEGER NOT NULL
        )
        """
    )

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS transaction (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cost REAL NOT NULL,
            date TEXT NOT NULL,
            store_name TEXT NOT NULL,
            category TEXT NOT NULL,
            user_id INTEGER NOT NULL
        )
        """
    )

    required_columns = {
        "source_id": "REAL",
        "cost": "REAL NOT NULL DEFAULT 0",
        "category": "TEXT NOT NULL DEFAULT ''",
        "store_name": "TEXT NOT NULL DEFAULT ''",
        "transaction_date": "TEXT NOT NULL DEFAULT '1970-01-01'",
        "user_id": "INTEGER NOT NULL DEFAULT 999",
    }

    cursor.execute("PRAGMA table_info(customer_data)")
    existing_columns = {row[1] for row in cursor.fetchall()}

    for column_name, column_definition in required_columns.items():
        if column_name not in existing_columns:
            cursor.execute(
                f"ALTER TABLE customer_data ADD COLUMN {column_name} {column_definition}"
            )


def ensure_demo_user(cursor, db_type: Literal["mysql", "sqlite"]) -> None:
    hashed_password = PWD_CONTEXT.hash(DEMO_PASSWORD[:72])

    if db_type == "mysql":
        cursor.execute(
            """
            INSERT INTO users (id, email, name, hashed_password)
            VALUES (%s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
                email = VALUES(email),
                name = VALUES(name),
                hashed_password = VALUES(hashed_password)
            """,
            (DEMO_USER_ID, DEMO_EMAIL, DEMO_NAME, hashed_password),
        )
        return

    cursor.execute(
        """
        INSERT OR IGNORE INTO users (id, email, name, hashed_password)
        VALUES (?, ?, ?, ?)
        """,
        (DEMO_USER_ID, DEMO_EMAIL, DEMO_NAME, hashed_password),
    )
    cursor.execute(
        """
        UPDATE users
        SET email = ?, name = ?, hashed_password = ?
        WHERE id = ?
        """,
        (DEMO_EMAIL, DEMO_NAME, hashed_password, DEMO_USER_ID),
    )


def seed_mysql(rows: list[tuple[float, float, str, str, str]]) -> tuple[int, int, int, int]:
    from backend.api.dependencies.database import engine  # noqa: E402

    inserted_customer_rows = 0
    deleted_customer_rows = 0
    inserted_transaction_rows = 0
    deleted_transaction_rows = 0

    with engine.begin() as connection:
        cursor = connection.connection.cursor()
        try:
            ensure_schema_mysql(cursor)
            ensure_demo_user(cursor, "mysql")

            cursor.execute("DELETE FROM customer_data WHERE user_id = %s", (DEMO_USER_ID,))
            deleted_customer_rows = cursor.rowcount if cursor.rowcount is not None else 0
            cursor.execute("DELETE FROM `transaction` WHERE user_id = %s", (DEMO_USER_ID,))
            deleted_transaction_rows = cursor.rowcount if cursor.rowcount is not None else 0

            for source_id, cost, category, store_name, tx_date in rows:
                cursor.execute(
                    """
                    INSERT INTO customer_data
                    (source_id, cost, category, store_name, transaction_date, user_id)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    """,
                    (source_id, cost, category, store_name, tx_date, DEMO_USER_ID),
                )
                inserted_customer_rows += 1

                cursor.execute(
                    """
                    INSERT INTO `transaction`
                    (cost, date, store_name, category, user_id)
                    VALUES (%s, %s, %s, %s, %s)
                    """,
                    (cost, tx_date, store_name, category, DEMO_USER_ID),
                )
                inserted_transaction_rows += 1
        finally:
            cursor.close()

    return (
        inserted_customer_rows,
        deleted_customer_rows,
        inserted_transaction_rows,
        deleted_transaction_rows,
    )


def seed_sqlite(rows: list[tuple[float, float, str, str, str]]) -> tuple[int, int, int, int]:
    sqlite_path = os.getenv("SQLITE_PATH", str(PROJECT_ROOT / "trace.db"))
    connection = sqlite3.connect(sqlite_path)
    inserted_customer_rows = 0
    inserted_transaction_rows = 0

    try:
        cursor = connection.cursor()
        ensure_schema_sqlite(cursor)

        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                hashed_password TEXT NOT NULL
            )
            """
        )

        ensure_demo_user(cursor, "sqlite")

        cursor.execute("DELETE FROM customer_data WHERE user_id = ?", (DEMO_USER_ID,))
        deleted_customer_rows = cursor.rowcount if cursor.rowcount is not None else 0
        cursor.execute("DELETE FROM transaction WHERE user_id = ?", (DEMO_USER_ID,))
        deleted_transaction_rows = cursor.rowcount if cursor.rowcount is not None else 0

        for source_id, cost, category, store_name, tx_date in rows:
            cursor.execute(
                """
                INSERT INTO customer_data
                (source_id, cost, category, store_name, transaction_date, user_id)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (source_id, cost, category, store_name, tx_date, DEMO_USER_ID),
            )
            inserted_customer_rows += 1

            cursor.execute(
                """
                INSERT INTO transaction
                (cost, date, store_name, category, user_id)
                VALUES (?, ?, ?, ?, ?)
                """,
                (cost, tx_date, store_name, category, DEMO_USER_ID),
            )
            inserted_transaction_rows += 1

        connection.commit()
    finally:
        connection.close()

    return (
        inserted_customer_rows,
        deleted_customer_rows,
        inserted_transaction_rows,
        deleted_transaction_rows,
    )


def main() -> None:
    rows = load_source_rows()
    db_type = detect_database_type()

    if db_type == "mysql":
        inserted_customer_rows, deleted_customer_rows, inserted_transaction_rows, deleted_transaction_rows = seed_mysql(rows)
    else:
        inserted_customer_rows, deleted_customer_rows, inserted_transaction_rows, deleted_transaction_rows = seed_sqlite(rows)

    print(f"Seed complete for {db_type}.")
    print(f"Deleted existing demo customer_data rows: {deleted_customer_rows}")
    print(f"Inserted demo customer_data rows: {inserted_customer_rows}")
    print(f"Deleted existing demo transaction rows: {deleted_transaction_rows}")
    print(f"Inserted demo transaction rows: {inserted_transaction_rows}")
    print(f"Demo user id: {DEMO_USER_ID}")


if __name__ == "__main__":
    main()
