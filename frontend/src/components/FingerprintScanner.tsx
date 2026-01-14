import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useFingerprintStore } from '@/stores/fingerprintStore';
import { bufferToHex, hexToBuffer } from '@/lib/webauthn';
import { Fingerprint } from 'lucide-react';

// Fixed salt for deterministic key derivation (same as webauthn.ts)
const PRF_SALT = new TextEncoder().encode("OnRamp-Hackathon-Biometric-Salt-v1");

const FingerprintKeyGen: React.FC = () => {
  const [status, setStatus] = useState<string>('Ready');
  const [isScanning, setIsScanning] = useState(false);
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
    // Check if expired on mount
    if (isExpired() && privateKey) {
      clearPrivateKey();
      setStatus('Session expired. Please scan again.');
    }

    // Update countdown every second
    const interval = setInterval(() => {
      const remaining = getTimeRemaining();
      setTimeRemaining(remaining);

      // Auto-clear if expired
      if (remaining !== null && remaining <= 0 && privateKey) {
        clearPrivateKey();
        setStatus('Session expired. Please scan again.');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [privateKey, isExpired, getTimeRemaining, clearPrivateKey]);

  // Format time remaining as MM:SS
  const formatTimeRemaining = (ms: number | null): string => {
    if (ms === null || ms <= 0) return '00:00';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const startScan = async () => {
    try {
      setIsScanning(true);
      setStatus('Scanning...');
      
      // Check if biometrics are supported
      if (!window.PublicKeyCredential) {
        throw new Error("WebAuthn not supported");
      }

      let credential: PublicKeyCredential;
      let derivedSecret: string;
      let currentCredentialId: string | null = credentialId;
      let authenticated = false;

      // Always try to authenticate first (reuse existing credential if available)
      // This ensures we use the same credential for consistent PRF output
      try {
        const challenge = crypto.getRandomValues(new Uint8Array(32));
        
        const getOptions: PublicKeyCredentialRequestOptions = {
          challenge,
          timeout: 60000,
          userVerification: "required",
          extensions: {
            // @ts-ignore - prf types might be missing in standard lib
            prf: {
              eval: {
                first: PRF_SALT,
              },
            },
          } as any,
        };

        // If we have a stored credentialId, use it to ensure we get the same credential
        if (currentCredentialId) {
          const credentialIdBuffer = hexToBuffer(currentCredentialId);
          getOptions.allowCredentials = [{
            id: credentialIdBuffer,
            type: "public-key",
          }];
        }
        // Otherwise, let the browser choose any available credential

        credential = await navigator.credentials.get({
          publicKey: getOptions,
        }) as PublicKeyCredential;

        if (!credential) {
          throw new Error("Authentication failed");
        }

        const extensionResults = credential.getClientExtensionResults();
        // @ts-ignore
        const prfResults = extensionResults.prf;

        if (!prfResults || !prfResults.results || !prfResults.results.first) {
          throw new Error("Device failed to return PRF secret.");
        }

        const derivedSecretBuffer = prfResults.results.first;
        derivedSecret = bufferToHex(derivedSecretBuffer);
        
        // Update credentialId if we got a different one (or didn't have one stored)
        const returnedCredentialId = bufferToHex(credential.rawId);
        if (returnedCredentialId !== currentCredentialId) {
          console.log('Updating credentialId:', returnedCredentialId);
          currentCredentialId = returnedCredentialId;
        } else {
          console.log('Reusing existing credentialId:', currentCredentialId);
        }
        
        authenticated = true;
      } catch (authError) {
        // If authentication fails, we'll create a new credential below
        console.log("Authentication failed, will create new credential...", authError);
        authenticated = false;
      }

      // If authentication failed, create a new credential
      if (!authenticated) {
        const challenge = crypto.getRandomValues(new Uint8Array(32));
        const userId = new TextEncoder().encode("fingerprint-scanner-user");
        
        const createOptions: PublicKeyCredentialCreationOptions = {
          challenge,
          rp: {
            name: "OnRamp Crypto Wallet",
          },
          user: {
            id: userId,
            name: "fingerprint@scanner.local",
            displayName: "Fingerprint Scanner User",
          },
          pubKeyCredParams: [
            { alg: -7, type: "public-key" }, // ES256
            { alg: -257, type: "public-key" }, // RS256
          ],
          timeout: 60000,
          attestation: "none",
          authenticatorSelection: {
            authenticatorAttachment: "platform", // Forces TouchID/FaceID/Hello
            userVerification: "required",
            requireResidentKey: true,
          },
          extensions: {
            // @ts-ignore - prf types might be missing in standard lib
            prf: {
              eval: {
                first: PRF_SALT,
              },
            },
          } as any,
        };

        // Trigger the OS Fingerprint/FaceID prompt
        credential = await navigator.credentials.create({
          publicKey: createOptions,
        }) as PublicKeyCredential;

        if (!credential) {
          throw new Error("Failed to create credential");
        }

        // Extract PRF output
        const extensionResults = credential.getClientExtensionResults();
        // @ts-ignore
        const prfResults = extensionResults.prf;

        if (!prfResults || !prfResults.results || !prfResults.results.first) {
          throw new Error("Device does not support WebAuthn PRF extension (Secure Key Derivation). Please use Chrome/Edge on a supported device.");
        }

        const derivedSecretBuffer = prfResults.results.first;
        derivedSecret = bufferToHex(derivedSecretBuffer);
        
        // Store the credential ID for future use
        const newCredentialId = bufferToHex(credential.rawId);
        
        // Convert PRF secret to Ethereum private key
        const privKey = derivePrivateKeyFromSecret(derivedSecret);

        console.log('privKey', privKey);
        
        // Create wallet from private key
        const wallet = new ethers.Wallet('0x' + privKey);
        
        // Store in Zustand store with credential ID (which handles expiration)
        setPrivateKey('0x' + privKey, wallet.address, newCredentialId);
        
        setStatus('Success!');
        return;
      }

      // If we authenticated with existing credential, derive and store the key
      const privKey = derivePrivateKeyFromSecret(derivedSecret);
      
      console.log('Derived privKey from existing credential:', privKey);
      
      // Create wallet from private key
      const wallet = new ethers.Wallet('0x' + privKey);
      
      // Store in Zustand store with credentialId (which handles expiration)
      // This ensures credentialId is persisted even if it was just discovered
      setPrivateKey('0x' + privKey, wallet.address, currentCredentialId);
      
      setStatus('Success!');
    } catch (err: any) {
      console.error(err);
      setStatus(`Error: ${err.message}`);
    } finally {
      setIsScanning(false);
    }
  };

  // Helper function to derive a valid Ethereum private key from PRF secret
  const derivePrivateKeyFromSecret = (derivedSecret: string): string => {
    // Convert PRF secret to Ethereum private key
    // The PRF secret is 32 bytes (64 hex chars), which is perfect for Ethereum private keys
    // Ensure it's a valid private key (must be less than secp256k1 curve order)
    let privKey = derivedSecret;
    
    // If the hex string is too long, truncate it; if too short, pad it
    if (privKey.length > 64) {
      privKey = privKey.substring(0, 64);
    } else if (privKey.length < 64) {
      privKey = privKey.padEnd(64, '0');
    }

    // Ensure the private key is valid (less than secp256k1 curve order)
    const maxKey = '0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141';
    let privKeyBigInt = BigInt('0x' + privKey);
    const maxKeyBigInt = BigInt(maxKey);
    
    if (privKeyBigInt >= maxKeyBigInt) {
      // Reduce modulo curve order if too large
      privKeyBigInt = privKeyBigInt % maxKeyBigInt;
      privKey = privKeyBigInt.toString(16).padStart(64, '0');
    }

    return privKey;
  };

  const handleClear = () => {
    clearPrivateKey();
    setStatus('Ready');
    setTimeRemaining(null);
  };

  return (
    <div className="glass p-6 space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-4">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-sm font-medium text-primary">Fingerprint Key Generator</span>
        </div>
        <h3 className="text-2xl font-bold text-foreground mb-2">Fingerprint Private Key Generator</h3>
        <p className="text-muted-foreground text-sm">
          Generate a deterministic Ethereum private key from your biometric data
        </p>
      </div>

      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-2">
          Status: <strong className="text-foreground">{status}</strong>
        </p>
        
        {timeRemaining !== null && timeRemaining > 0 && (
          <p className="text-xs text-muted-foreground mb-4">
            Expires in: <span className="font-mono font-semibold text-primary">{formatTimeRemaining(timeRemaining)}</span>
          </p>
        )}
      </div>
      
      <div className="flex justify-center">
        <button
          onClick={startScan}
          disabled={isScanning}
          className={`
            relative w-28 h-28 rounded-full flex items-center justify-center transition-all duration-300
            bg-gradient-to-br from-primary to-secondary
            disabled:opacity-40 disabled:cursor-not-allowed
            ${!isScanning && !privateKey ? 'animate-pulse-glow' : ''}
            hover:scale-105 active:scale-95
          `}
        >
          <Fingerprint className="w-12 h-12 text-primary-foreground" />
          {isScanning && (
            <div className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
          )}
        </button>
      </div>

      {walletAddress && privateKey && (
        <div className="glass-strong p-4 rounded-xl space-y-3 animate-fade-in">
          <div>
            <p className="text-xs text-muted-foreground mb-1">ETH Address</p>
            <p className="font-mono text-sm text-foreground break-all bg-muted/30 p-2 rounded">
              {walletAddress}
            </p>
          </div>
          
          <div>
            <p className="text-xs text-muted-foreground mb-1">Derived Private Key</p>
            <p className="font-mono text-xs text-foreground break-all bg-muted/30 p-2 rounded">
              {privateKey.substring(0, 20)}...{privateKey.substring(privateKey.length - 8)}
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <small className="text-xs text-destructive flex-1">
              ⚠️ For demo purposes only. Never expose full keys.
            </small>
            <button
              onClick={handleClear}
              className="text-xs px-3 py-1.5 rounded-full bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FingerprintKeyGen;
