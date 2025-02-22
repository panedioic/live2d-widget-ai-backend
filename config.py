import os
import json
from pathlib import Path

class Config:
    def __init__(self):
        self.config_path = Path(__file__).parent / "config.json"
        self._load_config()
        
    def _load_config(self):
        with open(self.config_path, 'r') as f:
            self.data = json.load(f)
        
        # 环境变量覆盖
        self.data['openai']['api_key'] = os.getenv('OPENAI_API_KEY', 
                                                 self.data['openai']['api_key'])
    
    @property
    def openai(self):
        return self.data['openai']
    
    @property 
    def session(self):
        return self.data['session']
    
    @property
    def admin(self):
        return self.data['admin']

config = Config()
