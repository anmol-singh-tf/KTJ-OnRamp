# ⚡ Pulse & AI Nexus (OnRamp X KTJ)

**Zero-Key, Biometric-Only Ethereum Wallet with Agentic Intelligence.**

> **Hackathon Project**: Built for the OnRamp Track 1.
> **Objective**: Eliminate seed phrases entirely using device biometrics (WebAuthn) and simplify crypto interactions using Natural Language AI.

---

## Key Features

### 1. True Biometric Security (WebAuthn / Passkeys)

- **Hardware-Backed Security**: Uses your device's Secure Enclave (TouchID, FaceID, Windows Hello, Android Biometrics).
- **PRF Extension**: Leverages the **WebAuthn PRF Extension** to deterministically derive a unique 32-byte secret from your hardware chip.
- **No Seed Phrases**: The Private Key is mathematically derived **on-demand** for 1 millisecond and then wiped from memory. It is _never_ stored on disk or DB.

### 2. AI Nexus (Agentic Layer)

- **Natural Language Actions**: "Book a flight to Mumbai under 0.05 ETH".
- **Smart Parsing**: The Agent identifies the intent, fetches real-time data (mocked for demo), and auto-fills transaction details.
- **Human-in-the-Loop**: The AI prepares the transaction; YOU sign it with your Face/Check.

### 3. Mobile-First Experience

- **PWA-Ready**: Designed to represent a mobile wallet app.
- **QR Scanner**: Integrated `html5-qrcode` scanner for "Scan & Pay" flows.
- **Mobile Connected**: configured to run securely on mobile browsers via LAN using Magic DNS (`nip.io`).

---

## Architecture

### The Backend (Flask + Web3)

- **Language**: Python (Flask)
- **Key Derivation**: Receives `PRF Secret` from frontend -> SHA256 Hash -> Private Key.
- **Blockchain**: Connects to **Sepolia Testnet** via resilient RPCs (DRPC/Ankr).
- **AI Engine**: `LangChain` + `Google Gemini 2.0 Flash`.

### The Frontend (React + Vite)

- **Biometrics**: `navigator.credentials` API with `prf` extension.
- **Security Context**: Runs over HTTPS (Self-signed) to allow access to device hardware.
- **UI**: Shadcn UI + Tailwind CSS (Glassmorphism).

---

## Getting Started

### Prerequisites

- **Python 3.10+**
- **Node.js & npm**
- **Google Gemini API Key** (in `.env`)

### Step 1: Backend Setup

1.  Create a virtual environment:
    ```bash
    python -m venv .venv
    ```
2.  Activate the virtual environment:
    ```bash
    source .venv/bin/activate
    ```
3.  Install Dependencies:
    ```bash
    pip install -r requirements.txt
    ```
4.  Set Environment Variables:
    ```bash
    cp .env.example .env
    ```
    - Edit `.env` to set your API key and other configurations.
5.  Run the backend:
    ```bash
    uvicorn app:app --reload --port 5000
    ```

### Step 2: Frontend Setup

1.  Navigate to frontend:
    ```bash
    cd frontend
    ```
2.  Install Packages:
    ```bash
    npm install
    ```
3.  Start Dev Server:
    ```bash
    npm run dev
    ```
    - **Output**: `Network: https://<YOUR-IP>:5173/`

### Step 3: Mobile Connection

WebAuthn **requires** a secure context (HTTPS) and a valid domain (IP addresses are often blocked). We use **Magic DNS (nip.io)** to solve this.

1.  **Find your PC's IP**: Look at the `npm run dev` output (e.g., `10.145.90.61`).
2.  **Open on Mobile**:
    - **URL**: `https://<YOUR-IP>.nip.io:5173`
    - **Example**: `https://10.145.90.61.nip.io:5173`
3.  **Trust Certificates**:
    - You will see "Connection not secure" (because of self-signed certs).
    - Click **Advanced -> Proceed** (on both port 5173 and port 5000).
    - _Tip: Open `https://<YOUR-IP>.nip.io:5000` in a separate tab first to trust the backend._

---

## Usage Flow (Live Demo)

1.  **Register (FaceID/TouchID)**:

    - Open App -> Click "Touch to Register".
    - Authenticate with your device.
    - **Result**: A new Ethereum Wallet is generated.

2.  **Fund Wallet**:

    - Add funds to your wallet address using the faucet.

3.  **Scan & Pay**:
    - Go to "Scan & Pay".
    - Scan an Ethereum QR Code (or enter address manually).
    - Enter Amount: example: `0.001`.
    - Click **"Touch to Pay"**.
    - **Result**: Transaction is signed biometrically and broadcast to Sepolia! (For demonstration we are using Ethereum Sepolia Testnet, but it can be used on any mainnet)

---

## Authors

**Aditya Singh Yadav, Aneesh Singh Rajoriya, Megha Singhal, Ajitesh Jamulkar, Anmol Singh**
