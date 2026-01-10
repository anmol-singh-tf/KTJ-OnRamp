from flask import Flask, render_template, request, jsonify
import os
import json
import subprocess
import biometrics
from eth_account import Account
import secrets
import agent_service
from flask_cors import CORS

app = Flask(__name__)
CORS(app) # Enable CORS for all routes (for React frontend)
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
        username = request.json.get('username')
        credential_id = request.json.get('credentialId')
        prf_secret = request.json.get('prfSecret')

        if not all([username, credential_id, prf_secret]):
             return jsonify({'error': 'Missing registration data'}), 400
             
        # Generate Key from PRF Secret locally to get the address
        key = biometrics.derive_key(prf_secret)
        
        # Derive Address for display
        account = Account.from_key(key)
        address = account.address
        
        # Cleanup key immediately
        del key
        
        # Store credential ID (and implicitly the user existence)
        # We DO NOT store the prf_secret or the private key.
        # helper_data is no longer needed because PRF is deterministic.
        MOCK_DB[username] = {
            'credential_id': credential_id,
            'address': address
        }

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
        username = request.json.get('username')
        receiver = request.json.get('receiver')
        amount = request.json.get('amount')
        prf_secret = request.json.get('prfSecret')

        if not all([username, receiver, amount, prf_secret]):
            return jsonify({'error': 'Missing payment data'}), 400

        if username not in MOCK_DB:
            return jsonify({'error': 'User not found'}), 404

        # In a real app, we would verify the WebAuthn signature here using the stored Public Key (from credential_id).
        # For this hackathon scope, we trust the PRF secret delivered by the authenticated client.
        
        # Serialize secret to pass to script (it's already hex string)
        # We pass it as the "helper_data" argument for compatibility, or just add a new argument.
        # Let's use the script's existing argument structure but repurpose.
        
        # pay_script.py expects: <receiver> <amount> <fingerprint_path> <helper_data_json>
        # We will modify pay_script.py to accept the SECRET directly.
        # Passing "PRF_MODE" as fingerprint_path to signal the script.
        
        cmd = [
            'python', 'pay_script.py',
            receiver.strip(),
            str(amount).strip(),
            "PRF_MODE", # Signal to use PRF secret
            prf_secret  # Passing secret in place of helper_data
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
    # Use adhoc SSL context for HTTPS (Requires 'pip install pyopenssl')
    app.run(debug=True, port=5000, host='0.0.0.0', ssl_context='adhoc')
