from flask import Blueprint, render_template, jsonify
from flask_login import login_required

debug_bp = Blueprint('debug', __name__, 
                   template_folder='templates',
                   static_folder='static')

@debug_bp.route('/debug')
# @login_required
def debug_console():
    """API调试控制台页面"""
    return render_template('api_debugger.html')

@debug_bp.route('/debug/history')
# @login_required
def debug_history():
    """调试历史记录接口（示例）"""
    return jsonify({
        "history": [
            {"time": "10:00", "endpoint": "POST /create_session", "status": 200},
            {"time": "10:05", "endpoint": "POST /chat", "status": 403}
        ]
    })
