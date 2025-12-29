from src.app.core.database import get_db_connection
from src.app.core.logging import get_logger

logger = get_logger(__name__)


def increment_qr_count():
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE stats SET total_qr_generated = total_qr_generated + 1 WHERE id = 1"
        )
        conn.commit()
    except Exception as e:
        logger.error(f"Error incrementing QR count: {e}")
    finally:
        conn.close()


def get_qr_count() -> int:
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT total_qr_generated FROM stats WHERE id = 1")
        result = cursor.fetchone()
        return result[0] if result else 0
    except Exception as e:
        logger.error(f"Error fetching QR count: {e}")
        return 0
    finally:
        conn.close()
