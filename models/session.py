from datetime import datetime
import time
import uuid

from flask import jsonify
from extensions import get_db
from config import config

class SessionManager:
    @staticmethod
    def create(ip: str):
        """创建新会话"""
        session_id = str(uuid.uuid4())
        now = time.time()
        
        with get_db() as conn:
            c = conn.cursor()
            # IP冷却检查
            c.execute('SELECT * FROM sessions WHERE ip = ? AND created_at > ?', 
                    (ip, now - config.data['session']['ip_cooldown']))
            if c.fetchone():
                return jsonify({"error": "IP cooling down"}), 429
            
            session_id = str(uuid.uuid4())
            c.execute('INSERT INTO sessions VALUES (?, ?, ?, ?, ?)',
                    (session_id, ip, now, now, 0))
            
            # 插入系统提示
            system_prompt = config.data['prompts']['system']
            c.execute('INSERT INTO messages (session_id, role, content, timestamp) VALUES (?, ?, ?, ?)',
                    (session_id, 'system', system_prompt, now))
            
            conn.commit()
        
        return jsonify({"session_id": session_id})

    @staticmethod
    def validate(session_id: str):
        """验证会话有效性"""
        cursor = db_conn.cursor()
        cursor.execute('''
            SELECT * FROM sessions 
            WHERE session_id = ?
        ''', (session_id,))
        return cursor.fetchone()
