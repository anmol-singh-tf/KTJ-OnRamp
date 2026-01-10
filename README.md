# 🖐️ Bio-Wallet & AI Concierge (OnRamp X KTJ)

**Zero-Key, Biometric-Only Ethereum Wallet with Agentic Intelligence.**

> **Hackathon Project**: Built for the OnRamp Track 1.
> **Objective**: Eliminate seed phrases entirely using biometrics and simplify crypto interactions using Natural Language AI.

---

## 🌟 Key Features

### 1. Biometric-Only Security (No Seed Phrases)
*   **True "Keyless" Experience**: Users never see or store a Private Key or Seed Phrase.
*   **On-the-Fly Key Derivation**: The Private Key is mathematically regenerated from your Fingerprint Scan + Helper Data (stored on-chain or database) only during the transaction moment.
*   **Ephemeral Security**: The key exists in memory for milliseconds and is wiped immediately after signing.

### 2. AI Concierge (Agentic Layer)
*   **Natural Language Actions**: "Book a flight to Mumbai under 20000 USDC".
*   **Smart Parsing**: The Agent identifies the **Receiver** and **Amount**, checks flight prices via tools, and auto-fills the transaction form.
*   **Human-in-the-Loop**: The AI prepares the transaction; YOU sign it with your fingerprint.

### 3. Modern Glassmorphism UI
*   Built with **React + Vite + Tailwind**.
*   Smooth animations, dark mode aesthetics, and "Scan & Pay" QR functionality.

---

## 🏗️ Architecture & Tech Stack

The system is split into two robust components:

### 1️⃣ The Backend (Brain & Security)
*   **Language**: Python (Flask)
*   **Cryptography**: `fuzzy_extractor` (Biometric Binding), `web3.py` (Blockchain Interaction).
*   **AI Engine**: `LangChain` + `Google Gemini 2.0 Flash`.
*   **Endpoints**:
    *   `/register`: Takes a username + fingerprint image -> Generates Wallet Address.
    *   `/pay`: Takes payment details + fingerprint -> Regenerates Key -> Signs & Broadcasts Tx.
    *   `/agent/chat`: Takes user text -> Returns JSON structured transaction proposals.

### 2️⃣ The Frontend (Interface)
*   **Framework**: React (Vite)
*   **Styling**: Tailwind CSS (Glassmorphism design).
*   **State Management**: React Hooks.
*   **API Communication**: `fetch` with CORS enabled to talk to the Flask backend.

---

## 🔧 Under the Hood: How it Works

### A. The Biometric Magic (Fuzzy Extractor)
1.  **Registration**:
    *   You upload a fingerprint.
    *   The system extracts feature points.
    *   It generates a **Private Key (R)** and **Helper Data (P)**.
    *   `R` is discarded. `P` is stored in the database (MOCK_DB).
2.  **Signing (The Trick)**:
    *   You upload the fingerprint again (which is slightly different due to noise).
    *   The system combines the **New Fingerprint** + **Helper Data (P)**.
    *   The **Fuzzy Extractor** algorithms correct the noise and recover the **Exact Original Private Key (R)**.
    *   The transaction is signed, and `R` is wiped from memory.

### B. The Agentic Layer
1.  **User Intent**: User types "Pay 0.05 ETH to Bob".
2.  **LLM Reasoning**: Google Gemini analyzes the text.
3.  **Tool Use**: If the user asks for "flights", the Agent calls a (Mock) `search_flights` tool to find prices, airlines, and the airline's wallet address.
4.  **Structured Output**: The Agent returns a clean JSON object:
    ```json
    {
      "text": "I found a flight for 0.05 ETH...",
      "auto_fill": {
        "receiver": "0x123...",
        "amount": 0.05
      }
    }
    ```
5.  **UI Reaction**: The Frontend detects `auto_fill` and populates the Payment Form automatically.

---

## 🚀 Getting Started

### Prerequisites
*   **Python 3.10+** (Recommend 3.11/3.12)
*   **Node.js & npm**
*   **Google Gemini API Key** (Free tier works, enable "Generative Language API")

### Step 1: Backend Setup
1.  Navigate to the root directory:
    ```bash
    cd "d:\Track 1 ORH"
    ```
2.  Install Dependencies:
    ```bash
    pip install -r requirements.txt
    ```
3.  Configure Environment:
    *   Ensure `.env` has your `GOOGLE_API_KEY`.
4.  Run the Server:
    ```bash
    python app.py
    ```
    *   *Server runs on `http://localhost:5000`*

### Step 2: Frontend Setup
1.  Open a new terminal and navigate to frontend:
    ```bash
    cd frontend
    ```
2.  Install Packages:
    ```bash
    npm install
    ```
3.  Start Development Server:
    ```bash
    npm run dev
    ```
    *   *UI runs on `http://localhost:5173`*

### Step 3: Usage Flow
1.  Open `http://localhost:5173`.
2.  **Register Tab**: Enter a username (e.g., "demo") and click the Fingerprint icon to upload a fingerprint image (`dummy_fingerprint.png` included in root).
    *   *Wait for "Wallet Created" toast.*
3.  **App Switch**: You are now logged in.
4.  **AI Concierge**: Switch to Chat tab. Type: *"Book a flight from Delhi to Mumbai under 20000 USDC"*.
5.  **Auto-Fill**: Click the fingerprint icon on the generated proposal.
6.  **Sign & Pay**: You will be taken to the "Scan & Pay" tab with fields filled. Click the Fingerprint icon again to Sign the transaction.

---

## 🛡️ Security Note
This is a **Hackathon Prototype**.
*   **Key Storage**: We do NOT store keys. We store `Helper Data`, which acts as a "Lock". Only your specific biometric data is the "Key".
*   **Production Readiness**: In production, the "Helper Data" should be stored on a Smart Contract or IPFS, making the wallet truly decentralized and portable.

---

## 👩‍💻 Authors
**Aditya Singh Yadav, Aneesh Singh Rajoriya, Megha Singhal, Ajitesh Jamulkar, Anmol Singh**
*Built with ❤️ for OnRamp*
