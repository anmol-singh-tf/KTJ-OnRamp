import requests
import json
import time

BASE_URL = "http://localhost:5001"
def test_register_api():
    url = f"{BASE_URL}/register"
    payload = {
        "username": f"testuser_{int(time.time())}",
        "wallet_address": "0x1234567890123456789012345678901234567890",
        "description": "Test merchant for API",
        "business_type": "Coffee Shop"
    }
    resp = requests.post(url, json=payload)
    assert resp.status_code == 200, f"Status: {resp.status_code}, Body: {resp.text}"
    data = resp.json()
    assert data["status"] == "success"
    assert data["username"] == payload["username"]


def test_agent_pay_success():
    # Use a valid merchant address from current merchant list
    # Using address that exists in merchants.json
    valid_address = "0x8bD0A4C1887cD12B07043F1F9bCa97D611C97233"
    pay_message = (
        f"Send 0.01 ETH to Coffee House"
    )
    url = f"{BASE_URL}/agent/chat"
    payload = {
        "message": pay_message
    }
    resp = requests.post(url, json=payload)
    assert resp.status_code == 200, f"Status: {resp.status_code}, Body: {resp.text}"
    result = resp.json()
    assert "text" in result
    assert "auto_fill" in result
    assert result["auto_fill"] is not None, f"auto_fill is None. Response: {result}"
    assert result["auto_fill"]["receiver"].lower() == valid_address.lower()
    assert result["auto_fill"]["amount"] == "0.01"


def test_agent_pay_invalid_amount():
    # Exceed spending limit (default is 1.0 ETH)
    pay_message = (
        "Send 5 ETH to Coffee House"
    )
    url = f"{BASE_URL}/agent/chat"
    payload = {
        "message": pay_message
    }
    resp = requests.post(url, json=payload)
    assert resp.status_code == 200
    result = resp.json()
    assert "text" in result
    assert "exceeds spending limit" in result["text"].lower()
    assert result["auto_fill"] is None

def test_agent_pay_invalid_address():
    # Use an address not in merchant list
    pay_message = (
        "Send 0.01 ETH to 0xinvalidmerchantaddress0000000000000000000000"
    )
    url = f"{BASE_URL}/agent/chat"
    payload = {
        "message": pay_message
    }
    resp = requests.post(url, json=payload)
    assert resp.status_code == 200
    result = resp.json()
    assert "text" in result
    assert "not a recognized merchant" in result["text"].lower()
    assert result["auto_fill"] is None

if __name__ == "__main__":
    print("Testing register API...")
    test_register_api()
    print("Testing agent pay success...")
    test_agent_pay_success()
    print("Testing agent pay invalid amount...")
    test_agent_pay_invalid_amount()
    print("Testing agent pay invalid address...")
    test_agent_pay_invalid_address()
    print("All tests passed!")