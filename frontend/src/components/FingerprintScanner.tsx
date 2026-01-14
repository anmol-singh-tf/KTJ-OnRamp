import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { motion, AnimatePresence } from 'framer-motion';
import { Fingerprint, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useFingerprintStore } from '@/stores/fingerprintStore';
import { bufferToHex, hexToBuffer } from '@/lib/webauthn';

// Fixed salt for deterministic key derivation
const PRF_SALT = new TextEncoder().encode("NexPay-Biometric-Salt-v1");

interface FingerprintScannerProps {
  onSuccess?: (privateKey: string, address: string) => void;
  onError?: (error: string) => void;
  buttonText?: string;
  showResult?: boolean;
  compact?: boolean;
}

const FingerprintScanner: React.FC<FingerprintScannerProps> = ({
  onSuccess,
  onError,
  buttonText = 'Scan to Authenticate',
  showResult = true,
  compact = false,
}) => {
  const [status, setStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  const { 
    privateKey, 
    walletAddress, 
    credentialId,
    setPrivateKey, 
    clearPrivateKey, 
    isExpired, 
    getTimeRemaining 
  } = useFingerprintStore();

  // Check expiration on mount and periodically update countdown
  useEffect(() => {
    if (isExpired() && privateKey) {
      clearPrivateKey();
      setStatus('idle');
    }

    const interval = setInterval(() => {
      const remaining = getTimeRemaining();
      setTimeRemaining(remaining);

      if (remaining !== null && remaining <= 0 && privateKey) {
        clearPrivateKey();
        setStatus('idle');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [privateKey, isExpired, getTimeRemaining, clearPrivateKey]);

  const formatTimeRemaining = (ms: number | null): string => {
    if (ms === null || ms <= 0) return '00:00';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const derivePrivateKeyFromSecret = (derivedSecret: string): string => {
    let privKey = derivedSecret;
    
    if (privKey.length > 64) {
      privKey = privKey.substring(0, 64);
    } else if (privKey.length < 64) {
      privKey = privKey.padEnd(64, '0');
    }

    const maxKey = '0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141';
    let privKeyBigInt = BigInt('0x' + privKey);
    const maxKeyBigInt = BigInt(maxKey);
    
    if (privKeyBigInt >= maxKeyBigInt) {
      privKeyBigInt = privKeyBigInt % maxKeyBigInt;
      privKey = privKeyBigInt.toString(16).padStart(64, '0');
    }

    return privKey;
  };

  const startScan = async () => {
    try {
      setStatus('scanning');
      setErrorMessage('');
      
      if (!window.PublicKeyCredential) {
        throw new Error("WebAuthn not supported on this device");
      }

      let credential: PublicKeyCredential;
      let derivedSecret: string;
      let currentCredentialId: string | null = credentialId;
      let authenticated = false;

      // Try to authenticate with existing credential first
      try {
        const challenge = crypto.getRandomValues(new Uint8Array(32));
        
        const getOptions: PublicKeyCredentialRequestOptions = {
          challenge,
          timeout: 60000,
          userVerification: "required",
          extensions: {
            // @ts-ignore
            prf: {
              eval: {
                first: PRF_SALT,
              },
            },
          } as AuthenticationExtensionsClientInputs,
        };

        if (currentCredentialId) {
          const credentialIdBuffer = hexToBuffer(currentCredentialId);
          getOptions.allowCredentials = [{
            id: credentialIdBuffer,
            type: "public-key",
          }];
        }

        credential = await navigator.credentials.get({
          publicKey: getOptions,
        }) as PublicKeyCredential;

        if (!credential) {
          throw new Error("Authentication failed");
        }

        const extensionResults = credential.getClientExtensionResults();
        // @ts-ignore
        const prfResults = extensionResults.prf;

        if (!prfResults?.results?.first) {
          throw new Error("Device failed to return PRF secret.");
        }

        derivedSecret = bufferToHex(prfResults.results.first);
        
        const returnedCredentialId = bufferToHex(credential.rawId);
        if (returnedCredentialId !== currentCredentialId) {
          console.log('Updating credentialId:', returnedCredentialId);
          currentCredentialId = returnedCredentialId;
        }
        
        authenticated = true;
      } catch (authError) {
        console.log("Authentication failed, creating new credential...", authError);
        authenticated = false;
      }

      // Create new credential if authentication failed
      if (!authenticated) {
        const challenge = crypto.getRandomValues(new Uint8Array(32));
        const userId = new TextEncoder().encode("nexpay-user-" + Date.now());
        
        const createOptions: PublicKeyCredentialCreationOptions = {
          challenge,
          rp: {
            name: "NexPay Crypto Wallet",
          },
          user: {
            id: userId,
            name: "user@nexpay.local",
            displayName: "NexPay User",
          },
          pubKeyCredParams: [
            { alg: -7, type: "public-key" },
            { alg: -257, type: "public-key" },
          ],
          timeout: 60000,
          attestation: "none",
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required",
            requireResidentKey: true,
          },
          extensions: {
            // @ts-ignore
            prf: {
              eval: {
                first: PRF_SALT,
              },
            },
          } as AuthenticationExtensionsClientInputs,
        };

        credential = await navigator.credentials.create({
          publicKey: createOptions,
        }) as PublicKeyCredential;

        if (!credential) {
          throw new Error("Failed to create credential");
        }

        const extensionResults = credential.getClientExtensionResults();
        // @ts-ignore
        const prfResults = extensionResults.prf;

        if (!prfResults?.results?.first) {
          throw new Error("Device does not support secure biometric key derivation. Please use Chrome/Edge on a supported device.");
        }

        derivedSecret = bufferToHex(prfResults.results.first);
        currentCredentialId = bufferToHex(credential.rawId);
      }

      const privKey = derivePrivateKeyFromSecret(derivedSecret);
      const wallet = new ethers.Wallet('0x' + privKey);
      
      console.log('Wallet created successfully:', {
        address: wallet.address,
        privateKeyPrefix: privKey,
      });
      
      setPrivateKey('0x' + privKey, wallet.address, currentCredentialId || undefined);
      setStatus('success');
      
      onSuccess?.('0x' + privKey, wallet.address);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'An unknown error occurred';
      console.error('Fingerprint scan error:', err);
      setErrorMessage(errorMsg);
      setStatus('error');
      onError?.(errorMsg);
    }
  };

  const handleClear = () => {
    clearPrivateKey();
    setStatus('idle');
    setTimeRemaining(null);
  };

  const buttonSize = compact ? 'w-20 h-20' : 'w-28 h-28';
  const iconSize = compact ? 'w-8 h-8' : 'w-12 h-12';

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Fingerprint Button */}
      <div className="relative">
        <motion.button
          onClick={startScan}
          disabled={status === 'scanning'}
          className={`
            relative ${buttonSize} rounded-full flex items-center justify-center
            bg-gradient-primary transition-all duration-300
            disabled:opacity-60 disabled:cursor-not-allowed
            hover:scale-105 active:scale-95
          `}
          whileTap={{ scale: 0.95 }}
          animate={status === 'idle' ? { boxShadow: ['0 0 20px -5px hsl(175 80% 40% / 0.4)', '0 0 40px -5px hsl(175 80% 40% / 0.7)', '0 0 20px -5px hsl(175 80% 40% / 0.4)'] } : {}}
          transition={{ duration: 2, repeat: status === 'idle' ? Infinity : 0 }}
        >
          <AnimatePresence mode="wait">
            {status === 'scanning' ? (
              <motion.div
                key="scanning"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <Loader2 className={`${iconSize} text-primary-foreground animate-spin`} />
              </motion.div>
            ) : status === 'success' ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <CheckCircle2 className={`${iconSize} text-primary-foreground`} />
              </motion.div>
            ) : status === 'error' ? (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <AlertCircle className={`${iconSize} text-primary-foreground`} />
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <Fingerprint className={`${iconSize} text-primary-foreground`} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pulse rings when scanning */}
          {status === 'scanning' && (
            <>
              <motion.div 
                className="absolute inset-0 rounded-full border-2 border-primary/50"
                animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <motion.div 
                className="absolute inset-0 rounded-full border-2 border-primary/30"
                animate={{ scale: [1, 1.8], opacity: [0.3, 0] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}
              />
            </>
          )}
        </motion.button>
      </div>

      {/* Status Text */}
      <motion.p 
        className="text-sm font-medium text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {status === 'scanning' && (
          <span className="text-primary">Scanning biometrics...</span>
        )}
        {status === 'idle' && (
          <span className="text-muted-foreground">{buttonText}</span>
        )}
        {status === 'success' && (
          <span className="text-success">Authentication successful!</span>
        )}
        {status === 'error' && (
          <span className="text-destructive">{errorMessage}</span>
        )}
      </motion.p>

      {/* Time Remaining */}
      {timeRemaining !== null && timeRemaining > 0 && status === 'success' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-muted-foreground"
        >
          Session expires in: <span className="font-mono text-primary">{formatTimeRemaining(timeRemaining)}</span>
        </motion.div>
      )}

      {/* Result Card */}
      {showResult && walletAddress && privateKey && status === 'success' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full glass rounded-xl p-4 space-y-3"
        >
          <div>
            <p className="text-xs text-muted-foreground mb-1">Your Wallet Address</p>
            <p className="font-mono text-sm text-foreground break-all bg-secondary/50 p-2 rounded-lg">
              {walletAddress}
            </p>
          </div>
          
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-muted-foreground">
              ✓ Ready to send/receive payments
            </span>
            <button
              onClick={handleClear}
              className="text-xs px-3 py-1.5 rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
            >
              Clear
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default FingerprintScanner;
