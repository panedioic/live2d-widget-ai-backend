from datetime import datetime
from extensions import get_db

class Message:
    @staticmethod
    def create(session_id, role, content):
        conn = get_db()
        c = conn.cursor()
        timestamp = datetime.now().timestamp()
        c.execute('''
            INSERT INTO messages 
            (session_id, role, content, timestamp)
            VALUES (?, ?, ?, ?)
        ''', (session_id, role, content, timestamp))
        conn.commit()
        return c.lastrowid

    @staticmethod
    def get_by_session(session_id):
        conn = get_db()
        c = conn.cursor()
        c.execute('''
            SELECT role, content, timestamp 
            FROM messages 
            WHERE session_id = ?
            ORDER BY timestamp
        ''', (session_id,))
        return c.fetchall()
