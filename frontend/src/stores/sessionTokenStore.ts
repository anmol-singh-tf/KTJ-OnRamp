import { create } from 'zustand';

interface SessionData {
  privateKey: string;
  walletAddress: string;
  expiresAt: number;
}

interface SessionTokenState {
  sessions: Map<string, SessionData>;
  createSession: (token: string, privateKey: string, walletAddress: string) => void;
  getSession: (token: string) => SessionData | null;
  validateToken: (token: string) => boolean;
  clearExpired: () => void;
  clearSession: (token: string) => void;
}

const SESSION_DURATION_MS = 5 * 60 * 1000; // 5 minutes

export const useSessionTokenStore = create<SessionTokenState>((set, get) => ({
  sessions: new Map(),

  createSession: (token: string, privateKey: string, walletAddress: string) => {
    const expiresAt = Date.now() + SESSION_DURATION_MS;
    const newSessions = new Map(get().sessions);
    newSessions.set(token, {
      privateKey,
      walletAddress,
      expiresAt,
    });
    set({ sessions: newSessions });
  },

  getSession: (token: string) => {
    const session = get().sessions.get(token);
    if (!session) return null;
    
    // Check if expired
    if (Date.now() >= session.expiresAt) {
      get().clearSession(token);
      return null;
    }
    
    return session;
  },

  validateToken: (token: string) => {
    const session = get().getSession(token);
    return session !== null;
  },

  clearExpired: () => {
    const now = Date.now();
    const sessions = get().sessions;
    const newSessions = new Map();
    
    for (const [token, session] of sessions.entries()) {
      if (session.expiresAt > now) {
        newSessions.set(token, session);
      }
    }
    
    set({ sessions: newSessions });
  },

  clearSession: (token: string) => {
    const newSessions = new Map(get().sessions);
    newSessions.delete(token);
    set({ sessions: newSessions });
  },
}));

// Clean up expired sessions periodically
if (typeof window !== 'undefined') {
  setInterval(() => {
    useSessionTokenStore.getState().clearExpired();
  }, 60000); // Check every minute
}
