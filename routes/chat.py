import time
from flask import Blueprint, request, jsonify
import openai
from openai import OpenAI

from extensions import get_db
from models.session import SessionManager
from models.message import Message
from utils.context import trim_context
from config import config

bp = Blueprint('chat', __name__, url_prefix='/api')

@bp.route('/create_session', methods=['POST'])
def create_session():
    ip = request.remote_addr
    res = SessionManager.create(ip)
    return res

@bp.route('/chat', methods=['POST'])
def chat():
    data = request.json
    session_id = data['session_id']
    message = data.get('message')
    
    if not session_id or not message:
        return jsonify({"error": "Invalid parameters"}), 400
    
    with get_db() as conn:
        c = conn.cursor()
        c.execute('SELECT * FROM sessions WHERE session_id = ?', (session_id,))
        session = c.fetchone()
        
        if not session:
            return jsonify({"error": "Invalid session ID"}), 404
        
        # 检查会话限制
        now = time.time()
        if (session['message_count'] >= config.data['session']['max_messages'] or 
            now - session['created_at'] > config.data['session']['timeout']):
            return jsonify({"error": "Session expired"}), 403
        
        # 保存用户消息
        c.execute('INSERT INTO messages (session_id, role, content, timestamp) VALUES (?, ?, ?, ?)',
                 (session_id, 'user', message, now))
        
        # 获取完整对话历史
        c.execute('SELECT role, content FROM messages WHERE session_id = ? ORDER BY timestamp', (session_id,))
        history = [dict(row) for row in c.fetchall()]
        
        try:
            client = OpenAI(api_key=config.data["openai"]["api_key"], base_url=config.data["openai"]["base_url"])
            response = client.chat.completions.create(
                model=config.data["openai"]["model"],
                messages=history,
                stream=True
            )
            ai_response = ''
            for chunk in response:
                ai_response += chunk.choices[0].delta.content
        except Exception as e:
            return jsonify({"error": str(e)}), 500
        
        # 保存AI回复
        c.execute('INSERT INTO messages (session_id, role, content, timestamp) VALUES (?, ?, ?, ?)',
                 (session_id, 'assistant', ai_response, now))
        
        # 更新会话
        c.execute('UPDATE sessions SET last_active = ?, message_count = message_count + 1 WHERE session_id = ?',
                 (now, session_id))
        conn.commit()
    
    return jsonify({"response": ai_response})
