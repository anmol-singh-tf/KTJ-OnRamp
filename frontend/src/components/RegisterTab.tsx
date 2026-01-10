import { useState } from "react";
import { Fingerprint, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { registerCredential } from "@/lib/webauthn";

interface RegisterTabProps {
    onRegister: (username: string, credentialId: string, prfSecret: string) => void;
}

const RegisterTab = ({ onRegister }: RegisterTabProps) => {
    const [username, setUsername] = useState("");
    const [isRippling, setIsRippling] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);

    const handleFingerprintClick = async () => {
        if (!username) {
            toast.error("Please enter a username first");
            return;
        }

        try {
            setIsRippling(true);
            setIsRegistering(true);

            // Trigger WebAuthn Registration
            const { credentialId, derivedSecret } = await registerCredential(username);

            // Pass the derived secret to the main App flow (to get the address and log in)
            onRegister(username, credentialId, derivedSecret);

        } catch (error: any) {
            toast.error(error.message || "Registration Failed");
        } finally {
            setIsRegistering(false);
            setTimeout(() => setIsRippling(false), 600);
        }
    };

    return (
        <div className="space-y-6">
            {/* Hero Card */}
            <div className="glass p-6 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/30 mb-4">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-sm font-medium text-blue-400">New Wallet Setup</span>
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Create Identity</h2>
                <p className="text-muted-foreground text-sm">
                    Register your biometric signature
                </p>
            </div>

            {/* Input Section */}
            <div className="glass p-6 space-y-4">
                <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                        Username
                    </label>
                    <div className="relative">
                        <User className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter unique username"
                            disabled={isRegistering}
                            className="input-glow w-full pl-9 text-foreground placeholder:text-muted-foreground/50"
                        />
                    </div>
                </div>
            </div>

            {/* Fingerprint Button */}
            <div className="relative flex flex-col items-center py-8">
                <button
                    onClick={handleFingerprintClick}
                    disabled={!username || isRegistering}
                    className={cn(
                        "relative w-28 h-28 rounded-full flex items-center justify-center transition-all duration-300",
                        "bg-gradient-to-br from-blue-500 to-purple-600",
                        "disabled:opacity-40 disabled:cursor-not-allowed",
                        !username ? "" : "animate-pulse-glow"
                    )}
                >
                    {isRippling && (
                        <div className="absolute inset-0 rounded-full bg-blue-400/30 animate-ripple" />
                    )}

                    <Fingerprint className="w-12 h-12 text-white" />
                </button>

                <p className="mt-4 text-sm font-medium text-muted-foreground">
                    {isRegistering ? "Verifying..." : "Touch to Register"}
                </p>
            </div>
        </div>
    );
};

export default RegisterTab;
