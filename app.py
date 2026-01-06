from flask import Flask, render_template, request, jsonify
import os
import json
import subprocess
import biometrics
from eth_account import Account
import secrets
import agent_service

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# MOCK_DB to store helper data
# Key: Username (or simple ID), Value: Helper Data
MOCK_DB = {}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/agent/chat', methods=['POST'])
def agent_chat():
    data = request.json
    user_message = data.get('message')
    if not user_message:
        return jsonify({'error': 'No message provided'}), 400
    
    # Call the Agent
    response_data = agent_service.run_agent(user_message)
    return jsonify(response_data)

@app.route('/register', methods=['POST'])
def register():
    try:
        username = request.form.get('username')
        if not username:
             return jsonify({'error': 'Username required'}), 400
             
        file = request.files['fingerprint']
        if not file:
            return jsonify({'error': 'No file uploaded'}), 400

        filepath = os.path.join(app.config['UPLOAD_FOLDER'], f"{username}_reg_{file.filename}")
        file.save(filepath)

        # Generate Key and Helper Data
        # Returns (key, helper_data)
        key, helper_data = biometrics.derive_key(filepath)
        
        # Store helper data
        # Helper data from fuzzy_extractor is a tuple/list. 
        # If it's bytes (mock or single value), convert to hex/list.
        if isinstance(helper_data, tuple):
             # Recursively handle bytes in tuple if needed, but assuming list of simple types for strict fuzzy extractor
             # For safety, let's just pickle or simplistic approach?
             # Better: Convert items to list/hex if bytes
             encoded_helper = []
             for item in helper_data:
                 if isinstance(item, bytes):
                     encoded_helper.append(item.hex())
                 elif isinstance(item, np.ndarray):
                     encoded_helper.append(item.tolist())
                 else:
                     encoded_helper.append(item)
             MOCK_DB[username] = encoded_helper
        elif isinstance(helper_data, bytes):
             MOCK_DB[username] = helper_data.hex()
        else:
             MOCK_DB[username] = helper_data

        # Derive Address for display
        account = Account.from_key(key)
        address = account.address
        
        # Cleanup key immediately
        del key

        return jsonify({
            'status': 'success',
            'username': username,
            'address': address
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/pay', methods=['POST'])
def pay():
    try:
        username = request.form.get('username')
        receiver = request.form.get('receiver')
        amount = request.form.get('amount')
        file = request.files['fingerprint']

        if not all([username, receiver, amount, file]):
            return jsonify({'error': 'Missing data'}), 400

        if username not in MOCK_DB:
            return jsonify({'error': 'User not found'}), 404

        filepath = os.path.join(app.config['UPLOAD_FOLDER'], f"{username}_pay_{file.filename}")
        file.save(filepath)

        helper_data = MOCK_DB[username]
        # Serialize helper data to JSON string to pass to script
        helper_data_json = json.dumps(helper_data)

        # Call separate script
        # python pay_script.py <receiver> <amount> <fingerprint_path> <helper_data_json>
        cmd = [
            'python', 'pay_script.py',
            receiver.strip(),
            amount.strip(),
            filepath,
            helper_data_json
        ]

        print("Running payment script...")
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        print("Script Output:", result.stdout)
        print("Script Error:", result.stderr)

        if result.returncode == 0:
            # Parse output for Tx Hash
            lines = result.stdout.strip().split('\n')
            tx_hash = None
            for line in lines:
                if "Tx Hash:" in line:
                    tx_hash = line.split("Tx Hash:")[1].strip()
            
            if tx_hash:
                 return jsonify({'status': 'success', 'tx_hash': tx_hash, 'logs': result.stdout})
            else:
                 return jsonify({'status': 'error', 'message': 'Tx Hash not found in output', 'logs': result.stdout})
        else:
            return jsonify({'status': 'error', 'message': result.stderr or result.stdout})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
