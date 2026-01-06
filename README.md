# Biometric-Only Ethereum Web Wallet + Agentic Spending

**Hackathon Track 1 (On-Chain Biometrics) & Agentic AI**

This project demonstrates a future where crypto wallets are **keyless**, **biometric-only**, and **intent-driven**. It combines a Non-Custodial Biometric Wallet with an AI Agent helper that allows you to "speak" your transactions.

---

## 🚀 Key Features

### 1. Keyless Biometric Wallet
*   **Zero Key Storage**: Private keys are **never** stored on disk or database.
*   **Fuzzy Extraction**: The private key is deterministically derived on-the-fly from your fingerprint scan.
*   **Atomic Signing**: Keys exist in RAM for milliseconds only during signing, then are effectively destroyed.

### 2. Agentic Spending (The "AI Concierge")
*   **Natural Language Interface**: Type "Book a flight to Mumbai" instead of hunting for hex addresses.
*   **Intent Understanding**: Uses **Google Gemini 1.5 Flash** (via LangChain) to parse user intent.
*   **Auto-Fill Magic**: The Agent finds the service (mocked flight search), negotiates the price, and **automatically fills the payment form** for the user.
*   **Human-in-the-Loop**: The Agent *prepares* the transaction, but YOU *authorize* it with your fingerprint.

---

## 🛠️ Architecture Deep Dive

### The "Brain" (Agent Layer) - `agent_service.py`
*   **Framework**: LangChain Core + Google GenAI.
*   **Role**: Translates human language into structured transaction data.
*   **Workflow**:
    1.  Receives text: *"Book flight..."*
    2.  Decides to call Tool: `search_flights(source="Delhi", dest="Mumbai")`.
    3.  Receives Mock Data: `{price: 0.005 ETH, receiver: "0x71C..."}`.
    4.  **Crucial Step**: Formats this data into a JSON instruction for the frontend: `{ "auto_fill": { "receiver": "...", "amount": ... } }`.

### The "Vault" (Wallet Layer) - `biometrics.py` & `app.py`
*   **Biometrics**: Uses OpenCV to process fingerprint images and a **Fuzzy Extractor** to recover the private key from noisy inputs.
*   **Mock Mode**: To ensure compatibility on all machines without C-compilers, we use a `MockFuzzyExtractor` compliant with the interface. It requires bit-perfect image matching but proves the cryptographic flow.

### The "Enclave" (Signing Layer) - `pay_script.py`
*   An isolated Python script spawned *only* when you click Pay.
*   **Input**: Fingerprint Image + Helper Data + Transaction Details.
*   **Action**: Reconstructs Key -> Signs Tx -> Broadcasts to Polygon Amoy.
*   **Cleanup**: Process terminates immediately, wiping memory.

---

## ⚙️ Setup & Installation

### Prerequisites
*   Python 3.8+
*   Google Gemini API Key (Get one [here](https://aistudio.google.com/)).

### Installation
1.  **Clone & Install**:
    ```bash
    pip install -r requirements.txt
    ```

2.  **Configure API Key**:
    *   Open `.env` file.
    *   Add your key: `GOOGLE_API_KEY=AIzaSy...`

3.  **Start Application**:
    ```bash
    python app.py
    ```
    Access at `http://localhost:5000`.

---

## 🏃 Usage Guide

### Phase 1: Registration
1.  **Username**: Enter any name.
2.  **Fingerprint**: Upload an image (e.g., `dummy_fingerprint.png`).
3.  **Create**: Save the generated wallet address.
4.  **Fund**: Send Testnet MATIC to this address via [Polygon Faucet](https://faucet.polygon.technology/).

### Phase 2: Agentic Spending
1.  **Chat**: In the "AI Concierge" box, type: *"I need a flight to Mumbai."*
2.  **Observe**:
    *   The Agent replies: *"Found an Indigo flight..."*
    *   The **Receiver** and **Amount** fields on the right light up Green.
3.  **Authorize**:
    *   Upload your **Same Fingerprint** to the payment card.
    *   Click **Sign & Pay**.
4.  **Verify**: Click the Transaction Hash link to view on PolygonScan.

---

## ⚠️ Notes for Judges

*   **Mock Data**: The "Flight Search" is mocked to ensure reliable demo performance. It returns random prices (0.0001 - 0.001 ETH) and a static receiver address.
*   **Security**: In production, the biometric processing would occur in a TEE (Trusted Execution Environment), and the Agent would connect to real APIs like Skyscanner/Amadeus.
