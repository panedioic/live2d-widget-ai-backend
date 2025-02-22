from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import UserMixin

from extensions import get_db

class User(UserMixin):
    def __init__(self, user_id):
        self.id = user_id
    
    @staticmethod
    def get(user_id):
        with get_db() as conn:
            c = conn.cursor()
            c.execute('SELECT * FROM users WHERE id = ?', (user_id,))
            return c.fetchone()
    
    @staticmethod
    def create(username, password):
        hashed_pw = generate_password_hash(password)
        conn = get_db()
        c = conn.cursor()
        c.execute('INSERT INTO users (username, password_hash) VALUES (?, ?)',
                 (username, hashed_pw))
        conn.commit()
        return c.lastrowid
