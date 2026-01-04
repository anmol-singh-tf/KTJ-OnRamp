import sys
import json
from web3 import Web3
from eth_account import Account
import biometrics
import os

def main():
    if len(sys.argv) != 5:
        print("Usage: python pay_script.py <receiver> <amount> <fingerprint_path> <helper_data_json>")
        sys.exit(1)

    receiver_address = sys.argv[1].strip()
    amount_eth = float(sys.argv[2])
    fingerprint_path = sys.argv[3]
    helper_data_str = sys.argv[4]

    try:
        # Load helper data
        # Helper data from app might be a list (from tuple) or a hex string (from bytes)
        raw_helper = json.loads(helper_data_str)
        
        helper_data = None
        if isinstance(raw_helper, list):
            # If list, checks elements. If they act like hex strings of bytes...
            # But fuzzy_extractor expects tuple of numpy probably.
            # Simplified for Mock: Mock produces bytes helper.
            # Real fuzzy: produces tuple.
            # To be robust: If we see list of strings, maybe convert back? 
            # For now, let's assume Mock usage mainly or robust fuzzy usage.
            # If standard fuzzy_extractor usage, it might be fine as list? 
            # Actually, let's just pass it as tuple.
            helper_data = tuple(raw_helper)
        elif isinstance(raw_helper, str):
            # Assume hex string
            helper_data = bytes.fromhex(raw_helper)
        else:
            helper_data = raw_helper

        # 1. Derive Private Key
        print("Deriving key from biometrics...")
        private_key = biometrics.derive_key(fingerprint_path, helper_data)
        
        # Verify key format (fuzzy extractor returns bytes, we might need hex)
        # eth_account accepts bytes or hex.
        # If private_key is bytes, keep it as is.

        # 2. Connect to Polygon Amoy
        rpc_url = "https://rpc-amoy.polygon.technology" # Public RPC
        w3 = Web3(Web3.HTTPProvider(rpc_url))
        
        if not w3.is_connected():
            print("Error: Could not connect to Polygon Amoy RPC")
            sys.exit(1)

        # 3. Create Account Object
        account = Account.from_key(private_key)
        sender_address = account.address
        print(f"Sender Address: {sender_address}")

        # 4. Build Transaction
        nonce = w3.eth.get_transaction_count(sender_address)
        gas_price = w3.eth.gas_price
        
        tx = {
            'nonce': nonce,
            'to': receiver_address,
            'value': w3.to_wei(amount_eth, 'ether'),
            'gas': 21000, # Standard ETH transfer
            'gasPrice': gas_price,
            'chainId': 80002 # Polygon Amoy Chain ID
            # 'chainId': 11155111 # Sepolia Chain ID (backup)
        }

        # 5. Sign Transaction
        print("Signing transaction...")
        signed_tx = w3.eth.account.sign_transaction(tx, private_key)

        # 6. Broadcast
        print("Broadcasting...")
        tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction) # Corrected attribute name snake_case

        # 7. Cleanup
        del private_key
        del account

        print(f"Success! Tx Hash: {w3.to_hex(tx_hash)}")

    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
