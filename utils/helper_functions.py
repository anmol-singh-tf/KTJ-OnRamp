import os
import json
import requests


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

def pay(apiendpoint, receiver_address, amount):
    """
    Pays a merchant using the payment API endpoint.
    Args:
        apiendpoint (str): The API endpoint URL to call for payment.
        receiver_address (str): The receiver's wallet address.
        amount (float): Amount to send in ETH.
    Returns:
        dict: Result of payment, or reason for failure.
    """
    payload = {
        "receiver": receiver_address,
        "amount": amount
    }
    response = requests.post(apiendpoint, json=payload)
    if response.status_code == 200:
        return {"success": True, "tx_hash": response.json().get("tx_hash")}
    else:
        return {"success": False, "error": response.text}