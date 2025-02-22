import os
from flask import Flask
from config import config
from extensions import init_app, login_manager
from routes.admin import admin_bp
from models.user import User
from routes.chat import bp as chat_bp
from routes.admin import admin_bp as admin_bp
from routes.debug import debug_bp as debug_bp

def create_app():
    app = Flask(__name__)
    app.secret_key = os.urandom(24)
    
    # 加载配置
    app.config.update({
        'DATABASE': config.data['database']['path'],
        'OPENAI_KEY': config.openai['api_key']
    })
    
    # 初始化扩展
    init_app(app)
    
    # 注册蓝图
    app.register_blueprint(chat_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(debug_bp) 
    
    # 用户加载器
    @login_manager.user_loader
    def load_user(user_id):
        user = User.get(user_id)
        return User(user['id']) if user else None
    
    return app

if __name__ == '__main__':
    app = create_app()
    print(os.getenv('OPENAI_API_KEY'))
    app.run(host=config.data['server']['host'], 
            port=config.data['server']['port'])
