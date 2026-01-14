import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import type { Plugin } from "vite";
import { randomUUID } from "crypto";
const { ethers } = await import('ethers');

// In-memory stores for session management
interface PendingAuth {
  token: string;
  resolve: (value: { privateKey: string; walletAddress: string }) => void;
  reject: (error: string) => void;
  createdAt: number;
}

interface SessionData {
  privateKey: string;
  walletAddress: string;
  expiresAt: number;
}

const pendingAuths = new Map<string, PendingAuth>();
const sessions = new Map<string, SessionData>();

// Clean up expired sessions and old pending auths
setInterval(() => {
  const now = Date.now();
  
  // Clean expired sessions
  for (const [token, session] of sessions.entries()) {
    if (session.expiresAt <= now) {
      sessions.delete(token);
    }
  }
  
  // Clean old pending auths (older than 5 minutes)
  for (const [token, auth] of pendingAuths.entries()) {
    if (now - auth.createdAt > 5 * 60 * 1000) {
      auth.reject('Authorization request expired');
      pendingAuths.delete(token);
    }
  }
}, 60000); // Run every minute

const agentPaymentPlugin = (): Plugin => ({
  name: 'agent-payment-api',
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      // CORS headers for all agent endpoints
      const setCorsHeaders = () => {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      };

      // Handle OPTIONS preflight
      if (req.method === 'OPTIONS') {
        setCorsHeaders();
        res.statusCode = 200;
        res.end();
        return;
      }

      // Handle /api/register-token - Agent requests authorization
      if (req.url === '/api/register-token' && req.method === 'POST') {
        setCorsHeaders();
        
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
          try {
            // Generate unique session token
            const token = randomUUID();
            
            // Create pending authorization that will be resolved by the React app
            const authPromise = new Promise<{ privateKey: string; walletAddress: string }>((resolve, reject) => {
              pendingAuths.set(token, {
                token,
                resolve,
                reject,
                createdAt: Date.now(),
              });
            });

            // Wait for user authorization (with timeout)
            const timeout = new Promise<never>((_, reject) => {
              setTimeout(() => reject(new Error('Authorization timeout')), 5 * 60 * 1000);
            });

            try {
              const { privateKey, walletAddress } = await Promise.race([authPromise, timeout]);
              
              // Store session (5 minute expiry)
              sessions.set(token, {
                privateKey,
                walletAddress,
                expiresAt: Date.now() + 5 * 60 * 1000,
              });

              res.statusCode = 200;
              res.end(JSON.stringify({ 
                success: true, 
                token 
              }));
            } catch (error: any) {
              pendingAuths.delete(token);
              res.statusCode = 403;
              res.end(JSON.stringify({ 
                success: false, 
                error: error.message || 'Authorization failed' 
              }));
            }
          } catch (error: any) {
            res.statusCode = 500;
            res.end(JSON.stringify({ 
              success: false, 
              error: error.message || 'Internal server error' 
            }));
          }
        });
        return;
      }

      // Handle /api/pending-auth - React app polls for pending authorizations
      if (req.url === '/api/pending-auth' && req.method === 'GET') {
        setCorsHeaders();
        
        // Return first pending auth token (if any)
        const pendingTokens = Array.from(pendingAuths.keys());
        res.statusCode = 200;
        res.end(JSON.stringify({ 
          token: pendingTokens[0] || null 
        }));
        return;
      }

      // Handle /api/complete-auth - React app completes authorization
      if (req.url === '/api/complete-auth' && req.method === 'POST') {
        setCorsHeaders();
        
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
          try {
            const { token, privateKey, walletAddress } = JSON.parse(body);
            const pending = pendingAuths.get(token);
            
            if (pending) {
              pending.resolve({ privateKey, walletAddress });
              pendingAuths.delete(token);
              res.statusCode = 200;
              res.end(JSON.stringify({ success: true }));
            } else {
              res.statusCode = 404;
              res.end(JSON.stringify({ success: false, error: 'Authorization request not found' }));
            }
          } catch (error: any) {
            res.statusCode = 400;
            res.end(JSON.stringify({ success: false, error: error.message || 'Invalid request' }));
          }
        });
        return;
      }

      // Handle /api/cancel-auth - React app cancels authorization
      if (req.url === '/api/cancel-auth' && req.method === 'POST') {
        setCorsHeaders();
        
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
          try {
            const { token, error } = JSON.parse(body);
            const pending = pendingAuths.get(token);
            
            if (pending) {
              pending.reject(error || 'User cancelled authorization');
              pendingAuths.delete(token);
              res.statusCode = 200;
              res.end(JSON.stringify({ success: true }));
            } else {
              res.statusCode = 404;
              res.end(JSON.stringify({ success: false, error: 'Authorization request not found' }));
            }
          } catch (error: any) {
            res.statusCode = 400;
            res.end(JSON.stringify({ success: false, error: error.message || 'Invalid request' }));
          }
        });
        return;
      }

      // Handle /agent/pay - Agent makes payment with session token
      if (req.url === '/agent/pay' && req.method === 'POST') {
        setCorsHeaders();
        
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
          try {
            const { receiver, amount, sessionToken } = JSON.parse(body);
            
            // Validate session token
            const session = sessions.get(sessionToken);
            if (!session || Date.now() >= session.expiresAt) {
              res.statusCode = 403;
              res.end(JSON.stringify({ 
                success: false, 
                error: 'Invalid or expired session token' 
              }));
              return;
            }

          
       
            
            // Validate receiver address
            if (!ethers.utils.isAddress(receiver)) {
              res.statusCode = 400;
              res.end(JSON.stringify({ 
                success: false, 
                error: 'Invalid receiver address' 
              }));
              return;
            }

            // Validate amount
            if (amount <= 0) {
              res.statusCode = 400;
              res.end(JSON.stringify({ 
                success: false, 
                error: 'Amount must be greater than 0' 
              }));
              return;
            }

            try {

            const sepoliaRpcUrl = 'https://sepolia.infura.io/v3/a1cf6b93c95b4e079a21fa4fca874411';

            // Connect to Sepolia
            const provider = new ethers.providers.JsonRpcProvider(sepoliaRpcUrl);
            const wallet = new ethers.Wallet(session.privateKey, provider);

            // Get gas price
            const gasPrice = await provider.getGasPrice();

            // Create and send transaction
            const tx = {
              to: receiver,
              value: ethers.utils.parseEther(amount.toString()),
              gasLimit: 21000,
              gasPrice: gasPrice,
            };

            console.log('###Tx:', tx);

            const txResponse = await wallet.sendTransaction(tx);
            const txHash = txResponse.hash;

            console.log('###Tx hash:', txHash);

            res.statusCode = 200;
            res.end(JSON.stringify({ 
              success: true, 
              tx_hash: txHash 
            }));
            } catch (error: any) {
              console.error('Payment error:', error);
              res.statusCode = 500;
              res.end(JSON.stringify({ 
                success: false, 
                error: error.message || 'Payment failed' 
              }));
            }
          } catch (error: any) {
            console.error('Payment error:', error);
            res.statusCode = 500;
            res.end(JSON.stringify({ 
              success: false, 
              error: error.message || 'Payment failed' 
            }));
          }
        });
        return;
      }

      next();
    });
  },
});

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 5001,
    cors: true, // Enable global CORS
  },
  plugins: [react(), mode === "development" && componentTagger(), agentPaymentPlugin()].filter(Boolean) as Plugin[],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
}));