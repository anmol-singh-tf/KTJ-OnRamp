// This file is kept for potential future use or type definitions
// The payment functionality is now handled via:
// - Frontend: vite.config.ts middleware endpoints (/api/register-token, /agent/pay)
// - Agent: utils/helper_functions.py pay() function

export interface PayPayload {
  receiver: string;
  amount: number;
}

export interface PayResponse {
  success: boolean;
  tx_hash?: string;
  error?: string;
}