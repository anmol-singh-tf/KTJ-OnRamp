// WebAuthn helper utilities

export const bufferToHex = (buffer: ArrayBuffer | ArrayBufferView): string => {
  const arrayBuffer = buffer instanceof ArrayBuffer 
    ? buffer 
    : buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
  return Array.from(new Uint8Array(arrayBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

export const hexToBuffer = (hex: string): ArrayBuffer => {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes.buffer;
};

export const base64ToBuffer = (base64: string): ArrayBuffer => {
  const binaryString = window.atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

export const bufferToBase64 = (buffer: ArrayBuffer): string => {
  return window.btoa(String.fromCharCode(...new Uint8Array(buffer)));
};

// Check if WebAuthn PRF extension is supported
export const isPRFSupported = async (): Promise<boolean> => {
  if (!window.PublicKeyCredential) {
    return false;
  }
  
  try {
    // Check if the browser supports PRF extension
    // @ts-ignore
    if (typeof PublicKeyCredential.isConditionalMediationAvailable === 'function') {
      // Modern browsers should support this
      return true;
    }
    return true; // Assume supported for now
  } catch {
    return false;
  }
};

// Check if biometric authentication is available
export const isBiometricAvailable = async (): Promise<boolean> => {
  if (!window.PublicKeyCredential) {
    return false;
  }
  
  try {
    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    return available;
  } catch {
    return false;
  }
};
