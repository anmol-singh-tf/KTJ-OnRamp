import requests
import time
import os

BASE_URL = "http://localhost:5000"

def test_registration():
    print("Testing Registration...")
    url = f"{BASE_URL}/register"
    
    # Ensure dummy fingerprint exists
    if not os.path.exists("dummy_fingerprint.png"):
        print("Error: dummy_fingerprint.png not found")
        return None

    files = {'fingerprint': open('dummy_fingerprint.png', 'rb')}
    data = {'username': 'testuser'}
    
    try:
        response = requests.post(url, files=files, data=data)
        if response.status_code == 200:
            json_resp = response.json()
            print("Registration Success!")
            print(f"Address: {json_resp.get('address')}")
            return json_resp.get('address')
        else:
            print(f"Registration Failed: {response.text}")
            return None
    except Exception as e:
        print(f"Registration Exception: {e}")
        return None

def test_payment(receiver_address):
    print("\nTesting Payment...")
    url = f"{BASE_URL}/pay"
    
    files = {'fingerprint': open('dummy_fingerprint.png', 'rb')}
    data = {
        'username': 'testuser',
        'receiver': receiver_address, # Sending to self for test, or random
        'amount': '0.0001'
    }
    
    try:
        response = requests.post(url, files=files, data=data)
        if response.status_code == 200:
            json_resp = response.json()
            if json_resp.get('status') == 'success':
                print("Payment Initiated Successfully!")
                print(f"Tx Hash: {json_resp.get('tx_hash')}")
            else:
                print(f"Payment Logic Executed (Tx might have failed on chain): {json_resp}")
        else:
            print(f"Payment Request Failed: {response.text}")
    except Exception as e:
        print(f"Payment Exception: {e}")

if __name__ == "__main__":
    # Wait for server to start
    print("Waiting for server to ensure it is up...")
    time.sleep(2) 
    
    address = test_registration()
    if address:
        # We can't actually pay without funds, but we can try and see the logic execute
        # detailed logs will show "insufficient funds" likely
        test_payment(address)
