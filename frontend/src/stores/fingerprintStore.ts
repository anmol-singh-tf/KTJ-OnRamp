import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface FingerprintState {
  privateKey: string | null;
  walletAddress: string | null;
  expiresAt: number | null;
  credentialId: string | null;
  userName: string | null;
  isRegistered: boolean;
  isBusiness: boolean;
  businessName: string | null;
  businessDescription: string | null;
  isKycVerified: boolean;
  setPrivateKey: (privKey: string, address: string, credentialId?: string) => void;
  setUserName: (name: string) => void;
  setBusinessInfo: (name: string, description: string) => void;
  setKycVerified: (verified: boolean) => void;
  setRegistered: (registered: boolean) => void;
  clearPrivateKey: () => void;
  clearAll: () => void;
  isExpired: () => boolean;
  getTimeRemaining: () => number | null;
}

const STORAGE_KEY = 'nexpay-wallet-storage';
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
      userName: null,
      isRegistered: false,
      isBusiness: false,
      businessName: null,
      businessDescription: null,
      isKycVerified: false,

      setPrivateKey: (privKey: string, address: string, credentialId?: string) => {
        const expiresAt = generateExpirationTime();
        set({
          privateKey: privKey,
          walletAddress: address,
          expiresAt,
          credentialId: credentialId || null,
        });
      },

      setUserName: (name: string) => {
        set({ userName: name });
      },

      setBusinessInfo: (name: string, description: string) => {
        set({ 
          isBusiness: true,
          businessName: name, 
          businessDescription: description 
        });
      },

      setKycVerified: (verified: boolean) => {
        set({ isKycVerified: verified });
      },

      setRegistered: (registered: boolean) => {
        set({ isRegistered: registered });
      },

      clearPrivateKey: () => {
        set((state) => ({
          privateKey: null,
          walletAddress: null,
          expiresAt: null,
          credentialId: state.credentialId,
        }));
      },
      
      clearAll: () => {
        set({
          privateKey: null,
          walletAddress: null,
          expiresAt: null,
          credentialId: null,
          userName: null,
          isRegistered: false,
          isBusiness: false,
          businessName: null,
          businessDescription: null,
          isKycVerified: false,
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
      storage: createJSONStorage(() => localStorage),
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
