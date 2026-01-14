export const bufferToHex = (buffer: BufferSource): string => {
    let bytes: Uint8Array;
    if (buffer instanceof ArrayBuffer) {
        bytes = new Uint8Array(buffer);
    } else {
        bytes = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    }

    return Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
};

export const hexToBuffer = (hex: string): ArrayBuffer => {
    const tokens = hex.match(/.{1,2}/g);
    if (!tokens) return new ArrayBuffer(0);
    return new Uint8Array(tokens.map((token) => parseInt(token, 16))).buffer;
};

// Fixed salt for deterministic key derivation for this app 
// In production, this might be unique per user or rotated, but for
// a "stateless" key derivation from hardware, a constant app-wide salt 
// ensures the SAME hardware always outputs the SAME secret for this app.
const PRF_SALT = new TextEncoder().encode("OnRamp-Hackathon-Biometric-Salt-v1");

export const registerCredential = async (username: string) => {
    if (!window.PublicKeyCredential) {
        throw new Error("WebAuthn not supported");
    }

    // Generate random challenge (server should nominally do this to prevent replay, 
    // but for this 'stateless key' demo, client-side is acceptable as we trust the PRF output)
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const userId = new TextEncoder().encode(username);

    const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
        challenge,
        rp: {
            name: "OnRamp Crypto Wallet",
        },
        user: {
            id: userId,
            name: username,
            displayName: username,
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
            requireResidentKey: true, // specific for passkeys
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

    const credential = (await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions,
    })) as PublicKeyCredential;

    // Extract PRF output
    const extensionResults = credential.getClientExtensionResults();

    // @ts-ignore
    const prfResults = extensionResults.prf;

    if (!prfResults || !prfResults.results || !prfResults.results.first) {
        throw new Error("Device does not support WebAuthn PRF extension (Secure Key Derivation). Please use Chrome/Edge on a supported device.");
    }

    const derivedSecretBuffer = prfResults.results.first;
    const derivedSecret = bufferToHex(derivedSecretBuffer);

    return {
        credentialId: bufferToHex(credential.rawId),
        derivedSecret, // This is our "Private Key Seed"
    };
};

export const authenticateCredential = async () => {
    if (!window.PublicKeyCredential) {
        throw new Error("WebAuthn not supported");
    }

    const challenge = crypto.getRandomValues(new Uint8Array(32));

    const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
        challenge,
        timeout: 60000,
        userVerification: "required",
        extensions: {
            prf: {
                eval: {
                    first: PRF_SALT,
                },
            },
        } as any,
    };

    const credential = (await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions,
    })) as PublicKeyCredential;

    const extensionResults = credential.getClientExtensionResults();
    const prfResults = extensionResults.prf;

    if (!prfResults || !prfResults.results || !prfResults.results.first) {
        throw new Error("Device failed to return PRF secret.");
    }

    const derivedSecretBuffer = prfResults.results.first;
    const derivedSecret = bufferToHex(derivedSecretBuffer);

    return {
        credentialId: bufferToHex(credential.rawId),
        derivedSecret,
    };
};
