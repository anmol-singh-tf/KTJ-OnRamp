# Biometric-Only Ethereum Web Wallet (Hackathon Track 1)

**A "Keyless" Web Wallet where your fingerprint *is* your specific private key.**

This project demonstrates a biometric-only Ethereum wallet for the OnRamp Hackathon. Unlike traditional wallets that store private keys (encrypted or otherwise), this wallet **deterministically derives** the private key on-the-fly from a fingerprint scan using a cryptographic fuzzy extractor. The private key exists only in memory during the transaction signing process and is immediately erased afterwards.

## 🚀 Key Features

*   **Zero Key Storage**: No private keys are saved to disk or database.
*   **Biometric Derivation**: Uses OpenCV and Fuzzy Extractors to generate stable keys from noisy biometric data.
*   **Ethereum Integration**: Connects to **Polygon Amoy Testnet** for real transactions.
*   **Modern UI**: Dark-mode interface with Tailwind CSS.
*   **QR Payment**: Built-in QR code scanner for easy receiver address input.

## 🛠️ Tech Stack

*   **Backend**: Python (Flask)
*   **Blockchain**: Web3.py, Eth-Account
*   **Biometrics**: OpenCV (Image Processing), Fuzzy Extractor (Key Derivation)
*   **Frontend**: HTML5, JavaScript, Tailwind CSS, html5-qrcode

## 📋 Prerequisites

*   Python 3.8 or higher.
*   An internet connection (to connect to Polygon RPC).
*   A fingerprint image (or use the provided `dummy_fingerprint.png` generator).

## ⚙️ Installation

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```

2.  **Install Dependencies**:
    ```bash
    pip install -r requirements.txt
    ```
    *Note: If you encounter issues installing `fuzzy_extractor` on Windows, the system will automatically fall back to a `MockFuzzyExtractor` included in `biometrics.py` for demonstration purposes.*

## 🏃 Usage Guide

### 1. Start the Server
Run the Flask application:
```bash
python app.py
```
Open your browser and navigate to: `http://localhost:5000`

### 2. Register (Create Wallet)
1.  Enter a **Username**.
2.  Upload a **Fingerprint Image** (supports PNG/JPG).
    *   *Tip: You can generate a test image by running `python create_dummy_image.py`.*
3.  Click **Create Wallet**.
4.  **Important**: The system will display your generated **Wallet Address**. Copy this address.

### 3. Fund Your Wallet
Since this is on the **Polygon Amoy Testnet**, you need test MATIC to pay for gas fees.
*   Go to a [Polygon Faucet](https://faucet.polygon.technology/).
*   Paste your generated wallet address.
*   Request Testnet MATIC.

### 4. Send Payment
1.  Enter your **Username** from step 2.
2.  Enter the **Receiver Address** (or use the "Toggle QR Scanner" button).
3.  Enter the **Amount** (e.g., `0.001`).
4.  Upload the **SAME Fingerprint Image** you used to register.
5.  Click **Sign & Pay**.

### 5. Verify Transaction
*   Check the "System Logs" panel at the bottom of the screen.
*   If successful, you will see a **Transaction Hash**.
*   Click the link or copy the hash to [PolygonScan (Amoy)](https://amoy.polygonscan.com/) to view your transaction on the blockchain.

## ⚠️ Important Notes

*   **Prototype Status**: This is a hackathon prototype. Do not use with mainnet ETH.
*   **Fuzzy Extractor**: Real biometric data is noisy. The `fuzzy_extractor` library allows for some error tolerance, but consistent lighting/orientation of scans is recommended for best results.
*   **Mock Mode**: On systems where the C-based cryptographic libraries cannot compile, the app uses a `MockFuzzyExtractor`. This still proves the flow but requires the *exact* same image file (bit-perfect) to reproduce the key.

## 📂 Project Structure

*   `app.py`: Main Flask web server and API routes.
*   `biometrics.py`: Logic for image processing and key derivation.
*   `pay_script.py`: Standalone script for secure transaction signing.
*   `templates/index.html`: The frontend user interface.
*   `requirements.txt`: Python package dependencies.
