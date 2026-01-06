import requests
import json
import time

BASE_URL = "http://localhost:5000"

def test_agent_chat():
    print("\n--- Testing Agent Chat ---")
    payload = {"message": "Book a flight from Delhi to Mumbai"}
    try:
        response = requests.post(f"{BASE_URL}/agent/chat", json=payload)
        
        if response.status_code == 200:
            data = response.json()
            print("Response Status: 200 OK")
            print(f"Response Body: {json.dumps(data, indent=2)}")
            
            if "text" in data and "auto_fill" in data:
                print("PASS: Structure valid")
                if data["auto_fill"]:
                    print("PASS: Auto-fill data present")
                else:
                    print("WARN: Auto-fill data missing (might happen if agent didn't trigger)")
            else:
                print("FAIL: Invalid structure")
        else:
            print(f"FAIL: Status {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"FAIL: Connection Error - {e}")

if __name__ == "__main__":
    # Wait a bit for server to be definitely ready
    time.sleep(2) 
    test_agent_chat()
