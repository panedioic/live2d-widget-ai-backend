from flask import Blueprint, render_template, redirect, request, url_for
from flask_login import login_required, current_user, login_user
from werkzeug.security import generate_password_hash, check_password_hash
from models.user import User
# from models.blog import Blog
from models.message import Message
from extensions import get_db
from config import config

admin_bp = Blueprint('admin', __name__, url_prefix='/admin')

@admin_bp.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        if (username == config.data['admin']['username'] and 
            check_password_hash(generate_password_hash(config.data['admin']['password']), password)):
            user = User(1)
            login_user(user)
            return redirect(url_for('admin_dashboard'))
        return render_template('admin/login.html', error="Invalid credentials")
    return render_template('admin/login.html')

@admin_bp.route('/dashboard')
@login_required
def dashboard():
    return render_template('admin/dashboard.html')

@admin_bp.route('/chat_history')
@login_required
def chat_history():
    with get_db() as conn:
        c = conn.cursor()
        c.execute('''SELECT s.session_id, s.ip, s.created_at, COUNT(m.id) as message_count
                     FROM sessions s LEFT JOIN messages m ON s.session_id = m.session_id
                     GROUP BY s.session_id ORDER BY s.created_at DESC LIMIT 100''')
        sessions = c.fetchall()
    return render_template('admin/chat_history.html', sessions=sessions)

@admin_bp.route('/blogs')
@login_required
def manage_blogs():
    with get_db() as conn:
        c = conn.cursor()
        c.execute('SELECT * FROM blogs ORDER BY created_at DESC')
        blogs = c.fetchall()
    return render_template('admin/blogs.html', blogs=blogs)

@admin_bp.route('/users')
@login_required
def manage_users():
    # ...用户管理逻辑...
    pass
