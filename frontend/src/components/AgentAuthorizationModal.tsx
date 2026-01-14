import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, AlertCircle } from 'lucide-react';
import FingerprintScanner from './FingerprintScanner';
import { useSessionTokenStore } from '@/stores/sessionTokenStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface AgentAuthorizationModalProps {
  token: string | null;
  onClose: () => void;
}

const AgentAuthorizationModal: React.FC<AgentAuthorizationModalProps> = ({ token, onClose }) => {
  const [authorized, setAuthorized] = useState(false);
  const { createSession } = useSessionTokenStore();

  const handleSuccess = async (privateKey: string, walletAddress: string) => {
    if (!token) return;

    // Store session in sessionTokenStore
    createSession(token, privateKey, walletAddress);

    // Complete authorization via API
    try {
      const response = await fetch('/api/complete-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, privateKey, walletAddress }),
      });

      if (response.ok) {
        setAuthorized(true);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        handleError('Failed to complete authorization');
      }
    } catch (error) {
      handleError('Network error');
    }
  };

  const handleError = async (error: string) => {
    if (!token) return;

    try {
      await fetch('/api/cancel-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, error }),
      });
    } catch {
      // Ignore network errors on cancel
    }
    onClose();
  };

  const handleCancel = async () => {
    await handleError('User cancelled authorization');
  };

  if (!token) return null;

  return (
    <Dialog open={true} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Agent Payment Authorization
          </DialogTitle>
          <DialogDescription>
            An agent is requesting permission to make payments on your behalf.
            Please authorize with your fingerprint to continue.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center space-y-6 py-4">
          {!authorized ? (
            <>
              <div className="w-full space-y-4">
                <FingerprintScanner
                  onSuccess={handleSuccess}
                  onError={handleError}
                  buttonText="Authorize Payment"
                  showResult={false}
                />
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertCircle className="w-4 h-4" />
                <span>This authorization will expire in 5 minutes</span>
              </div>

              <div className="flex gap-2 w-full">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center space-y-2"
            >
              <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
                <Shield className="w-8 h-8 text-success" />
              </div>
              <p className="text-sm font-medium text-success">Authorization successful!</p>
              <p className="text-xs text-muted-foreground">The agent can now make payments.</p>
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Global component that checks for pending authorizations
export const AgentAuthorizationManager: React.FC = () => {
  const [currentToken, setCurrentToken] = useState<string | null>(null);

  useEffect(() => {
    // Poll for pending authorizations from the server
    const checkPending = async () => {
      try {
        const response = await fetch('/api/pending-auth');
        if (response.ok) {
          const data = await response.json();
          if (data.token && data.token !== currentToken) {
            setCurrentToken(data.token);
          }
        }
      } catch (error) {
        // Ignore polling errors
      }
    };

    const interval = setInterval(checkPending, 500); // Check every 500ms
    checkPending(); // Check immediately

    return () => clearInterval(interval);
  }, [currentToken]);

  const handleClose = () => {
    setCurrentToken(null);
  };

  return <AgentAuthorizationModal token={currentToken} onClose={handleClose} />;
};
