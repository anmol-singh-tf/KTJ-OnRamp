import os
import json

# Load merchants data
MERCHANTS_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "Data", "merchants.json")
with open(MERCHANTS_FILE, 'r') as f:
    MERCHANTS = json.load(f)

# Spending limit (in ETH) - default 1 ETH
SPENDING_LIMIT_ETH = float(os.getenv("SPENDING_LIMIT_ETH", "1.0"))

# Hardcoded API endpoint for payments
PAYMENT_API_ENDPOINT = os.getenv("PAYMENT_API_ENDPOINT", "http://localhost:5173/pay")