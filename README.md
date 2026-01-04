# Biometric-Only Ethereum Web Wallet (Track 1: On-Chain Biometrics)

**A "Keyless" Non-Custodial Wallet where your Identity IS your Private Key.**

## 📖 Project Overview

This project was built for the **OnRamp Hackathon (Track 1)** to demonstrate a novel approach to cryptocurrency wallets. Traditional wallets force users to manage mnemonics (seed phrases) or rely on centralized custodians. If you lose your seed phrase, you lose your funds.

**Our Solution**: A biometric-only wallet where the private key is **mathematically derived on-demand** from your fingerprint.
*   **No Seed Phrases**: You don't need to remember anything.
*   **No Stored Keys**: The private key never exists on a hard drive or database. It is fleetingly reconstructed in RAM only for the milliseconds required to sign a transaction, then destroyed.

---

## � Technical Deep Dive

### 1. How the Private Key is Generated (The Cryptography)

We utilize a **Fuzzy Extractor**, a cryptographic primitive that allows for secure key generation from noisy biometric data.

*   **The Problem with Biometrics**: Your fingerprint scan is never bit-for-bit identical twice. Lighting, pressure, and angle change the pixel data. Standard hashing (SHA-256) would produce completely different keys for slightly different scans.
*   **The Fuzzy Extractor Solution**:
    1.  **Registration (`generate`)**:
        *   Input: Initial Fingerprint Scan ($Bio$).
        *   Output: A stable Private Key ($R$) and public **Helper Data** ($P$).
        *   The Helper Data $P$ allows the system to correct errors in future scans but reveals *nothing* about the key $R$ itself.
    2.  **Payment (`reproduce`)**:
        *   Input: A new, slightly different Fingerprint Scan ($Bio'$) + The preserved Helper Data ($P$).
        *   Process: The extractor uses $P$ to "guide" the noisy $Bio'$ back to the original $Bio$ (mathematically) to reconstruct exactly $R$.
    3.  **Result**: The same Private Key is derived every time, despite biometric noise.

### 2. How the Transaction is Signed

The signing process assumes a "Zero-Trust" architecture regarding key storage.

1.  **User Action**: User uploads fingerprint image and clicks "Pay".
2.  **Ephemeral Reconstruction**: Python backend calls `biometrics.reproduce(new_scan, helper_data)`.
3.  **Key Instantiation (In-Memory)**: The Private Key object is created in volatile RAM.
4.  **Signing**: `web3.py` uses this object to cryptographically sign the Ethereum transaction object (containing Nonce, To, Value, Gas).
5.  **Atomic Cleanup**: Immediately after the signature is generated, the `private_key` variable is explicitly deleted (`del private_key`) and memory is freed. The key ceases to exist.
6.  **Broadcast**: Only the *signed transaction* (which is safe and public) is sent to the blockchain node.

### 3. System Wiring & Architecture

The application is structured as a modular pipeline to separate concerns:

*   **Frontend (`index.html`)**:
    *   **Tailwind CSS**: For a modern, responsive dark-mode UI.
    *   **HTML5-QRCode**: Runs entirely in the browser to scan receiver QR codes from the webcam.
    *   **API Calls**: Sends multipart/form-data (images + JSON) to the Flask backend.

*   **Backend API (`app.py`)**:
    *   Acts as the orchestrator.
    *   Receives images and payment details.
    *   Retrieves the user's public "Helper Data" from the mock database.
    *   **Security Barrier**: It delegates the actual signing to an isolated script.

*   **Secure Enclave Script (`pay_script.py`)**:
    *   An isolated process spawned *only* for a single transaction.
    *   **Input**: Fingerprint File, Helper Data, Payment Details.
    *   **Action**: Derives Key -> Connects to Polygon RPC -> Signs -> Broadcasts.
    *   **Output**: Transaction Hash.
    *   **Termination**: The process dies immediately after broadcasting, ensuring total memory clearance.

---

## 🌟 Benefits of this Architecture

1.  **True Non-Custodial Ownership**: Even the server admins cannot access your funds because they don't have your fingerprint (the source of entropy).
2.  **Improved UX**: "Scan to Pay" is familiar to Web2 users (like Apple Pay/FaceID) but maintains Web3 self-sovereignty.
3.  **Security**:
    *   **Resistance to Database Leaks**: If the database is hacked, attackers only get "Helper Data," which is useless without your physical fingerprint.
    *   **Resistance to Disk Forensics**: Keys are never written to the hard drive.
4.  **Cost Effective**: Uses the Polygon Amoy L2 Testnet for fast, cheap transactions.

---

## ⚙️ Setup & Usage

### Prerequisites
*   Python 3.8+
*   `pip install -r requirements.txt`

### Running the App
1.  **Start Server**: `python app.py`
2.  **Access**: `http://localhost:5000`

### User Flow
1.  **Register**: Upload a fingerprint scan. The system saves your "Helper Data".
2.  **Fund**: Get [Amoy MATIC](https://faucet.polygon.technology/) for the generated address.
3.  **Pay**: Enter receiver address (or scan QR), amount, and upload your fingerprint again.
4.  **Verify**: Click the Transaction Hash link in the logs to see it on the blockchain.

---

## ⚠️ Hackathon Prototype Notes

*   **Mock Fallback**: To ensure this runs on all judges' machines (Windows/Mac/Linux) without complex C-compiler setups, we included a `MockFuzzyExtractor`. If the strict `fuzzy_extractor` library fails to load, the mock takes over. The mock requires the **exact same image file** for key reproduction (zero noise tolerance) but perfectly demonstrates the architectural flow.
*   **Security**: In a production version, the fingerprint processing would happen inside a Trusted Execution Environment (TEE) or Secure Enclave (SGX) to prevent OS-level snooping.
