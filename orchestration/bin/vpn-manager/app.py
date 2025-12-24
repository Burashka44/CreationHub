from flask import Flask, render_template, jsonify, request
import os
import shutil
import subprocess
import requests
import time

app = Flask(__name__)

@app.after_request
def add_header(response):
    response.headers['X-Frame-Options'] = 'ALLOWALL'
    response.headers['Content-Security-Policy'] = "frame-ancestors *"
    return response

HOST_IP = "192.168.1.220" # Default fallback/wireguard/wg0.conf"
CONFIG_DIR = "/configs"
WG_CONF_PATH = "/etc/wireguard/wg0.conf"
# We control the sibling container 'vpn-client' via docker socket mapped to host
VPN_CONTAINER = "creationhub-vpn-client"

def get_vpn_ip_info():
    """Execute curl inside the VPN container to get its external IP info."""
    try:
        # 1. Try VPN Container (Exit Node)
        cmd = ["docker", "exec", VPN_CONTAINER, "curl", "-s", "--connect-timeout", "3", "https://ipinfo.io/json"]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=5)
        if result.returncode == 0 and result.stdout.strip():
            return result.stdout
        
        # 2. Fallback: Manager's own network (Real IP) unless strictly prohibited?
        # User asked: "shows where I am BY IP... even if I haven't loaded conf".
        # This implies showing the server's real IP.
        cmd_fallback = ["curl", "-s", "--connect-timeout", "3", "https://ipinfo.io/json"]
        res_fallback = subprocess.run(cmd_fallback, capture_output=True, text=True, timeout=5)
        if res_fallback.returncode == 0:
            return res_fallback.stdout
            
        return "{}"
    except Exception as e:
        # Fallback provided above, this catches subprocess crashes
        try:
             cmd_fallback = ["curl", "-s", "--connect-timeout", "3", "https://ipinfo.io/json"]
             res_fallback = subprocess.run(cmd_fallback, capture_output=True, text=True, timeout=5)
             return res_fallback.stdout
        except:
             return "{}"

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/status')
def status():
    # Get Config Name (heuristic: read comment or filename stored in state?)
    # For now, we return dynamic IP info
    data = get_vpn_ip_info()
    return app.response_class(data, mimetype='application/json')

@app.route('/api/configs')
def list_configs():
    files = []
    if os.path.exists(CONFIG_DIR):
        for f in os.listdir(CONFIG_DIR):
            if f.endswith(".conf"):
                files.append(f)
    return jsonify(sorted(files))

@app.route('/api/switch', methods=['POST'])
def switch_config():
    data = request.json
    filename = data.get('filename')
    
    src = os.path.join(CONFIG_DIR, filename)
    if not os.path.exists(src):
        return jsonify({"error": "File not found"}), 404
        
    # 1. Copy to wg0.conf
    # Note: /etc/wireguard must be a shared volume between Manager and Client
    try:
        shutil.copy2(src, WG_CONF_PATH)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    # 2. Restart VPN Container
    try:
        subprocess.run(["docker", "restart", VPN_CONTAINER], check=True)
    except Exception as e:
        return jsonify({"error": "Failed to restart VPN container: " + str(e)}), 500

    # 3. Wait a moment for connection
    time.sleep(3)
    
    return jsonify({"status": "ok", "message": f"Switched to {filename}"})

@app.route('/api/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    if file and file.filename.endswith('.conf'):
        # Secure filename? For private usage, simple check is ok.
        filename = file.filename
        filepath = os.path.join(CONFIG_DIR, filename)
        file.save(filepath)
        return jsonify({"status": "ok", "message": f"Uploaded {filename}"})
    else:
        return jsonify({"error": "Invalid file type. Must be .conf"}), 400

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
