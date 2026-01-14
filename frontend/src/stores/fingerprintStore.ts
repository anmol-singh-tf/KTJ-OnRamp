import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FingerprintState {
  privateKey: string | null;
  walletAddress: string | null;
  expiresAt: number | null;
  credentialId: string | null;
  setPrivateKey: (privKey: string, address: string, credentialId?: string) => void;
  clearPrivateKey: () => void;
  clearAll: () => void;
  isExpired: () => boolean;
  getTimeRemaining: () => number | null;
}

const STORAGE_KEY = 'fingerprint-wallet-storage';
const MIN_EXPIRATION_MS = 5 * 60 * 1000; // 5 minutes
const MAX_EXPIRATION_MS = 10 * 60 * 1000; // 10 minutes

// Generate random expiration time between 5-10 minutes
const generateExpirationTime = (): number => {
  const randomMs = Math.floor(
    Math.random() * (MAX_EXPIRATION_MS - MIN_EXPIRATION_MS) + MIN_EXPIRATION_MS
  );
  return Date.now() + randomMs;
};

export const useFingerprintStore = create<FingerprintState>()(
  persist(
    (set, get) => ({
      privateKey: null,
      walletAddress: null,
      expiresAt: null,
      credentialId: null,

      setPrivateKey: (privKey: string, address: string, credentialId?: string) => {
        const expiresAt = generateExpirationTime();
        set({
          privateKey: privKey,
          walletAddress: address,
          expiresAt,
          credentialId: credentialId || null,
        });
      },

      clearPrivateKey: () => {
        // Preserve credentialId so we can reuse the same credential
        // Only clear the private key and wallet data
        set((state) => ({
          privateKey: null,
          walletAddress: null,
          expiresAt: null,
          credentialId: state.credentialId, // Keep credentialId for reuse
        }));
      },
      
      // Separate method to completely reset (including credentialId)
      clearAll: () => {
        set({
          privateKey: null,
          walletAddress: null,
          expiresAt: null,
          credentialId: null,
        });
      },

      isExpired: () => {
        const { expiresAt } = get();
        if (!expiresAt) return true;
        return Date.now() >= expiresAt;
      },

      getTimeRemaining: () => {
        const { expiresAt } = get();
        if (!expiresAt) return null;
        const remaining = expiresAt - Date.now();
        return remaining > 0 ? remaining : 0;
      },
    }),
    {
      name: STORAGE_KEY,
      // Custom storage to handle expiration on load
      storage: {
        getItem: (name: string) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          
          try {
            const parsed = JSON.parse(str);
            const state = parsed.state;
            
            // Check if expired
            if (state.expiresAt && Date.now() >= state.expiresAt) {
              // Clear expired data
              localStorage.removeItem(name);
              return null;
            }
            
            return parsed;
          } catch {
            return null;
          }
        },
        setItem: (name: string, value: string) => {
          localStorage.setItem(name, value);
        },
        removeItem: (name: string) => {
          localStorage.removeItem(name);
        },
      },
    }
  )
);

// Initialize: Check and clear expired keys on store creation
if (typeof window !== 'undefined') {
  const store = useFingerprintStore.getState();
  if (store.isExpired() && store.privateKey) {
    store.clearPrivateKey();
  }
}
