from flask_login import LoginManager
from flask import g
import sqlite3
from config import config

login_manager = LoginManager()

def get_db():
    # if 'db' not in g:
    #     g.db = sqlite3.connect('data/chatbot.db')
    #     g.db.row_factory = sqlite3.Row
    # return g.db
    conn = sqlite3.connect(config.data['database']['path'])
    conn.row_factory = sqlite3.Row
    return conn

def close_db(e=None):
    db = g.pop('db', None)
    if db is not None:
        db.close()

def init_db():
    with get_db() as conn:
        c = conn.cursor()
        # 创建会话表
        c.execute('''CREATE TABLE IF NOT EXISTS sessions
                     (session_id TEXT PRIMARY KEY,
                      ip TEXT,
                      created_at REAL,
                      last_active REAL,
                      message_count INTEGER)''')
        # 创建消息表
        c.execute('''CREATE TABLE IF NOT EXISTS messages
                     (id INTEGER PRIMARY KEY AUTOINCREMENT,
                      session_id TEXT,
                      role TEXT,
                      content TEXT,
                      timestamp REAL)''')
        # 用户表
        c.execute('''CREATE TABLE IF NOT EXISTS users
                     (id INTEGER PRIMARY KEY AUTOINCREMENT,
                      username TEXT UNIQUE,
                      password_hash TEXT,
                      is_admin BOOLEAN DEFAULT 0)''')
        # 博客表
        c.execute('''CREATE TABLE IF NOT EXISTS blogs
                     (id INTEGER PRIMARY KEY AUTOINCREMENT,
                      title TEXT,
                      content TEXT,
                      author_id INTEGER,
                      created_at REAL,
                      updated_at REAL)''')
        conn.commit()

def init_app(app):
    login_manager.init_app(app)
    app.teardown_appcontext(close_db)
    init_db()
