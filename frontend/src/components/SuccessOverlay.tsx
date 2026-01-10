import { CheckCircle2, ExternalLink } from "lucide-react";

interface SuccessOverlayProps {
  isVisible: boolean;
  txHash: string;
  onClose: () => void;
}

const SuccessOverlay = ({ isVisible, txHash, onClose }: SuccessOverlayProps) => {
  if (!isVisible) return null;

  const shortenHash = (hash: string) => {
    return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-xl animate-fade-in">
      <div className="glass-strong p-8 max-w-sm w-full mx-4 text-center space-y-6">
        {/* Animated Checkmark */}
        <div className="relative w-24 h-24 mx-auto">
          {/* Glow effect */}
          <div className="absolute inset-0 rounded-full bg-success/20 blur-xl animate-pulse" />

          {/* Circle */}
          <div className="relative w-24 h-24 rounded-full bg-success/20 border-2 border-success flex items-center justify-center glow-success">
            <CheckCircle2 className="w-12 h-12 text-success" />
          </div>
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-foreground">
            Transaction Broadcasted!
          </h3>
          <p className="text-sm text-muted-foreground">
            Your payment has been successfully sent to the Sepolia network.
          </p>
        </div>

        {/* Transaction Hash */}
        <div className="glass p-4 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">Transaction Hash</p>
          <p className="font-mono text-sm text-foreground break-all">
            {shortenHash(txHash)}
          </p>
          <a
            href={`https://sepolia.etherscan.io/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
          >
            View on Explorer
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="btn-gradient w-full"
        >
          Done
        </button>
      </div>
    </div>
  );
};

export default SuccessOverlay;
