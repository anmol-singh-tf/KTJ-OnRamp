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

    # Arguments: <receiver> <amount> <fingerprint_path> <helper_data_or_secret>
    receiver_address = sys.argv[1].strip()
    amount_eth = float(sys.argv[2])
    arg3 = sys.argv[3] # Was fingerprint_path, now might be "PRF_MODE"
    arg4 = sys.argv[4] # Was helper_data, now might be prf_secret

    try:
        private_key = None
        
        if arg3 == "PRF_MODE":
            # PRF Mode: arg4 is the secret hex
            print("Deriving key from WebAuthn PRF Secret...")
            private_key = biometrics.derive_key(arg4)
        else:
            # Legacy Mode (if ever needed, but we replaced biometrics.py so this path is dead unless we kept it)
            # Since we replaced biometrics.derive_key to ONLY take secret_hex, 
            # we must assume PRF_MODE is the only valid mode now.
            print("Error: Legacy file-based mode is deprecated.")
            sys.exit(1)

        # 2. Connect to Sepolia Testnet
        # 2. Connect to Sepolia Testnet
        # Using DRPC as verified by check_rpc.py
        rpc_url = "https://sepolia.drpc.org" 
        w3 = Web3(Web3.HTTPProvider(rpc_url))
        
        if not w3.is_connected():
            print("Error: Could not connect to Sepolia RPC")
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
            'chainId': 11155111 # Sepolia Chain ID
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
