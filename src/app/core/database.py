import sqlite3
import os
from src.app.core.logging import get_logger

logger = get_logger(__name__)
DB_NAME = "database/stats.db"


def get_db_connection():
    conn = sqlite3.connect(DB_NAME, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    if not os.path.exists(DB_NAME):
        logger.info(f"Database {DB_NAME} not found. Creating...")

    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS stats (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                total_qr_generated INTEGER DEFAULT 0
            )
        """)
        # Initialize counter if table is empty
        cursor.execute("SELECT count(*) FROM stats")
        if cursor.fetchone()[0] == 0:
            cursor.execute("INSERT INTO stats (total_qr_generated) VALUES (0)")

        conn.commit()
        logger.info("Database initialized successfully.")
    except Exception as e:
        logger.error(f"Error initializing database: {e}")
    finally:
        conn.close()
