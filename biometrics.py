import hashlib
from eth_account import Account

def derive_key(prf_secret_hex):
    """
    Derives a private key from a WebAuthn PRF Secret.
    The secret is already a high-entropy 32-byte hex string from the hardware.
    We hash it once more for good measure (and to ensure bytes format) 
    and use it as the private key.
    """
    # secret_hex is expected to be a hex string from the frontend
    secret_bytes = bytes.fromhex(prf_secret_hex)
    
    # Sha256 to ensure it's a valid 32-byte key source
    key_bytes = hashlib.sha256(secret_bytes).digest()
    
    return key_bytes

