import os
import json
import uuid
import shutil
from flask import Flask, render_template, request, redirect, url_for, jsonify

app = Flask(__name__)

# Config
DATA_DIR = os.environ.get('DATA_DIR', '/data')
DATA_FILE = os.path.join(DATA_DIR, 'channels.json')
PROFILES_DIR = os.path.join(DATA_DIR, 'profiles')

PLATFORMS = ['YouTube', 'Rutube', 'Telegram', 'Instagram', 'TikTok', 'MAX Messenger']

@app.after_request
def add_header(response):
    response.headers['X-Frame-Options'] = 'ALLOWALL'
    response.headers['Content-Security-Policy'] = "frame-ancestors *"
    return response

def load_data():
    if not os.path.exists(DATA_FILE):
        return {p: [] for p in PLATFORMS}
    try:
        with open(DATA_FILE, 'r') as f:
            data = json.load(f)
            # Ensure all platforms exist
            for p in PLATFORMS:
                if p not in data:
                    data[p] = []
            return data
    except (json.JSONDecodeError, IOError):
        return {p: [] for p in PLATFORMS}

def save_data(data):
    # Ensure directory exists
    os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
    with open(DATA_FILE, 'w') as f:
        json.dump(data, f, indent=4)

def init_profile(profile_id):
    """Create isolated directory for the profile."""
    path = os.path.join(PROFILES_DIR, profile_id)
    os.makedirs(path, exist_ok=True)
    # Create subdirs for cookies and cache
    os.makedirs(os.path.join(path, 'browser_cache'), exist_ok=True)
    os.makedirs(os.path.join(path, 'session_data'), exist_ok=True)

def delete_profile(profile_id):
    """Remove isolated directory."""
    path = os.path.join(PROFILES_DIR, profile_id)
    if os.path.exists(path):
        shutil.rmtree(path)

@app.route('/')
def index():
    data = load_data()
    return render_template('index.html', platforms=PLATFORMS, data=data)

@app.route('/add', methods=['POST'])
def add_channel():
    platform = request.form.get('platform')
    name = request.form.get('name')
    url = request.form.get('url') # Identifier or URL
    
    if platform and name and url:
        data = load_data()
        if platform in data:
            profile_id = str(uuid.uuid4())
            new_channel = {
                'id': profile_id,
                'name': name,
                'url': url,
                'auth': {} # To store credentials
            }
            data[platform].append(new_channel)
            save_data(data)
            init_profile(profile_id)
            
    return redirect(url_for('index'))

@app.route('/delete', methods=['POST'])
def delete_channel():
    platform = request.form.get('platform')
    channel_id = request.form.get('id')
    
    data = load_data()
    if platform in data:
        # Find and remove
        idx_to_remove = -1
        for i, ch in enumerate(data[platform]):
            if ch.get('id') == channel_id:
                idx_to_remove = i
                break
        
        if idx_to_remove != -1:
            delete_profile(channel_id)
            data[platform].pop(idx_to_remove)
            save_data(data)
        
    return redirect(url_for('index'))

@app.route('/update_auth', methods=['POST'])
def update_auth():
    platform = request.form.get('platform')
    channel_id = request.form.get('id')
    
    # Collect auth fields
    # Generic map for flexibility
    new_auth = {}
    for key in request.form:
        if key not in ['platform', 'id']:
            new_auth[key] = request.form[key]

    data = load_data()
    if platform in data:
        for ch in data[platform]:
            if ch.get('id') == channel_id:
                # Merge or overwrite auth
                curr_auth = ch.get('auth', {})
                curr_auth.update(new_auth)
                ch['auth'] = curr_auth
                save_data(data)
                break
                
    return redirect(url_for('index'))

@app.route('/api/channels')
def api_channels():
    return jsonify(load_data())

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5002)
