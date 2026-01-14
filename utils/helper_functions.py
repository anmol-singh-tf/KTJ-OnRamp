import os
import json
import requests

session_token = None
def get_session_token():
    global session_token
    return session_token
def set_session_token(token):
    global session_token
    session_token = token

def register_merchant(account_address, name, business_type, description, kyc_info=None):
    """
    Registers a new merchant in Data/merchants.json if the name is unique.
    Supports both list and dict formats, but saves in list format for compatibility.
    Args:
        account_address (str): Merchant's wallet address.
        name (str): Unique merchant name.
        business_type (str): Type of business or business domain.
        description (str): Short business description.
        kyc_info (dict, optional): Legal KYC info to store (e.g., tax ID, contact).
    Returns:
        dict: Result of registration, or reason for failure.
    """
    merchants_path = os.path.join("Data", "merchants.json")
    # Load existing merchants
    if not os.path.exists(merchants_path):
        merchants_list = []
    else:
        with open(merchants_path, "r") as f:
            try:
                merchants_data = json.load(f)
                # Handle both list and dict formats
                if isinstance(merchants_data, list):
                    merchants_list = merchants_data
                elif isinstance(merchants_data, dict):
                    # Convert dict format to list format
                    merchants_list = []
                    for key, value in merchants_data.items():
                        merchant = {
                            "name": key,
                            "description": value.get("description", ""),
                            "receiver_address": value.get("wallet_address", value.get("receiver_address", ""))
                        }
                        merchants_list.append(merchant)
                else:
                    merchants_list = []
            except json.JSONDecodeError:
                merchants_list = []

    # Name uniqueness check (case-insensitive)
    name_lower = name.lower()
    for merchant in merchants_list:
        merchant_name = merchant.get("name", "")
        if isinstance(merchant_name, str) and merchant_name.lower() == name_lower:
            return {"success": False, "error": "Merchant name already exists. Please choose a unique name."}

    # Build merchant data object (list format for compatibility with agent_service)
    merchant_entry = {
        "name": name,
        "description": description,
        "receiver_address": account_address,
        "business_type": business_type,
        "kyc_info": kyc_info if kyc_info else {}
    }

    # Add new merchant to list
    merchants_list.append(merchant_entry)

    # Persist back to file
    os.makedirs(os.path.dirname(merchants_path), exist_ok=True)
    with open(merchants_path, "w") as f:
        json.dump(merchants_list, f, indent=2)

    return {"success": True, "merchant": merchant_entry}


def pay(api_endpoint, receiver_address, amount):
    """
    Pays a merchant via the restricted payment rail.
    
    This function:
    1. Calls frontend /api/register-token to request authorization (triggers UI)
    2. Waits for user to authorize with fingerprint
    3. Calls frontend /agent/pay with session token to execute payment
    4. Returns transaction hash or error
    
    Args:
        receiver_address (str): The receiver's wallet address on Sepolia
        amount (float): Amount to send in ETH
    
    Returns:
        dict: Result of payment with tx_hash or error
    """
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5001")
    
    session_token = get_session_token()
    
    try:
        if not session_token:   
            # Step 1: Request authorization token from frontend
            register_response = requests.post(
                f"{frontend_url}/api/register-token",
                json={},
                timeout=300  # 5 minute timeout for user authorization
            )
            
            if register_response.status_code != 200:
                return {
                    "success": False,
                    "error": f"Failed to register token: {register_response.text}"
                }
            
            register_data = register_response.json()
            if not register_data.get("success"):
                return {
                    "success": False,
                    "error": register_data.get("error", "Authorization failed")
                }   
            session_token = register_data.get("token")
            set_session_token(session_token)
            
        print(f"\n\n###Session token: {session_token}")
        
        # Step 2: Make payment with session token
        pay_payload = {
            "receiver": receiver_address,
            "amount": amount,
            "sessionToken": session_token
        }
        
        pay_response = requests.post(
            f"{frontend_url}/agent/pay",
            json=pay_payload,
            timeout=60
        )
        
        pay_data = pay_response.json()
        print(f"\n\n###Pay data: {pay_data}")
        if pay_response.status_code == 200 and pay_data.get("success"):
            return {
                "success": True,
                "tx_hash": pay_data.get("tx_hash"),
                "status": "Settled autonomously"
            }
        else:
            return {
                "success": False,
                "error": pay_data.get("error", "Payment failed")
            }
            
    except requests.exceptions.Timeout:
        return {
            "success": False,
            "error": "Authorization timeout - user did not respond in time"
        }
    except requests.exceptions.ConnectionError:
        return {
            "success": False,
            "error": f"Could not connect to frontend at {frontend_url}. Make sure the frontend server is running."
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

    