import { Fingerprint } from "lucide-react";

interface LoadingOverlayProps {
  isVisible: boolean;
}

const LoadingOverlay = ({ isVisible }: LoadingOverlayProps) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-xl animate-fade-in">
      <div className="text-center space-y-6">
        {/* Spinner */}
        <div className="relative w-24 h-24 mx-auto">
          {/* Outer ring */}
          <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
          {/* Spinning gradient ring */}
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin-slow" />
          {/* Inner icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Fingerprint className="w-10 h-10 text-primary animate-pulse" />
          </div>
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">
            Processing Biometrics
          </h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Deriving Cryptographic Keys from Biometrics...
          </p>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-1">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: "0ms" }} />
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: "200ms" }} />
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: "400ms" }} />
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay;
