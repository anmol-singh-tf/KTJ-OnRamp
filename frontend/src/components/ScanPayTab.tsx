import { useState, useRef, useEffect } from "react";
import { Fingerprint, Scan, Camera, X } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface ScanPayTabProps {
  onStartPayment: (receiver: string, amount: string, file: File) => void;
  receiverAddress: string;
  setReceiverAddress: (value: string) => void;
  paymentAmount: string;
  setPaymentAmount: (value: string) => void;
}

const ScanPayTab = ({
  onStartPayment,
  receiverAddress,
  setReceiverAddress,
  paymentAmount,
  setPaymentAmount,
}: ScanPayTabProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [isRippling, setIsRippling] = useState(false);
  const [scannerReady, setScannerReady] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = "qr-reader";

  const handleFingerprintClick = () => {
    setIsRippling(true);
    setTimeout(() => setIsRippling(false), 600);
    
    // Trigger hidden file input
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && receiverAddress && paymentAmount) {
      onStartPayment(receiverAddress, paymentAmount, file);
    }
  };

  const onScanSuccess = (decodedText: string) => {
    // Check if it's a valid Ethereum address
    let address = decodedText;
    
    // Handle ethereum: URI scheme
    if (decodedText.startsWith("ethereum:")) {
      address = decodedText.replace("ethereum:", "").split("@")[0].split("?")[0];
    }
    
    // Validate Ethereum address format
    if (address.match(/^0x[a-fA-F0-9]{40}$/)) {
      setReceiverAddress(address);
      toast({
        title: "QR Code Detected!",
        description: `Address: ${address.slice(0, 10)}...${address.slice(-8)}`,
      });
      stopScanner();
    }
  };

  const startScanner = async () => {
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(scannerContainerId);
      }

      await scannerRef.current.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 200, height: 200 },
        },
        onScanSuccess,
        () => {} // Ignore errors during scanning
      );
      
      setScannerReady(true);
      setIsScanning(true);
    } catch (err) {
      console.error("Error starting scanner:", err);
      toast({
        title: "Camera Error",
        description: "Could not access camera. Please check permissions.",
        variant: "destructive",
      });
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    try {
      if (scannerRef.current && scannerRef.current.isScanning) {
        await scannerRef.current.stop();
      }
    } catch (err) {
      console.error("Error stopping scanner:", err);
    }
    setScannerReady(false);
    setIsScanning(false);
  };

  const toggleScanner = () => {
    if (isScanning) {
      stopScanner();
    } else {
      startScanner();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Hero Card */}
      <div className="glass p-6 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-4">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-sm font-medium text-primary">Biometric Auth Ready</span>
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Scan & Pay</h2>
        <p className="text-muted-foreground text-sm">
          Zero-key transactions powered by biometrics
        </p>
      </div>

      {/* QR Scanner Section */}
      <div className="glass p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Scan className="w-5 h-5 text-primary" />
            Scan QR Code
          </h3>
          <button
            onClick={toggleScanner}
            className={cn(
              "flex items-center gap-1 text-xs px-3 py-1.5 rounded-full transition-all",
              isScanning 
                ? "bg-destructive/20 text-destructive hover:bg-destructive/30" 
                : "bg-primary/20 text-primary hover:bg-primary/30"
            )}
          >
            {isScanning ? (
              <>
                <X className="w-3 h-3" />
                Close Scanner
              </>
            ) : (
              <>
                <Camera className="w-3 h-3" />
                Open Scanner
              </>
            )}
          </button>
        </div>

        {/* Scanner Area */}
        <div
          className={cn(
            "relative aspect-square max-w-xs mx-auto rounded-xl overflow-hidden transition-all duration-300",
            isScanning ? "opacity-100" : "opacity-50"
          )}
        >
          {/* Scan Frame Corners - only show when not actively scanning */}
          {!scannerReady && (
            <div className="absolute inset-0 p-4 z-10 pointer-events-none">
              <div className="relative w-full h-full">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary rounded-br-lg" />
              </div>
            </div>
          )}

          {/* QR Scanner Container */}
          <div 
            id={scannerContainerId} 
            className={cn(
              "w-full h-full",
              !isScanning && "hidden"
            )}
          />

          {/* Placeholder when not scanning */}
          {!isScanning && (
            <div 
              className="absolute inset-0 bg-muted/50 flex items-center justify-center cursor-pointer"
              onClick={toggleScanner}
            >
              <div className="text-center">
                <Camera className="w-12 h-12 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Tap to activate camera</p>
              </div>
            </div>
          )}
        </div>

        {isScanning && (
          <p className="text-xs text-center text-muted-foreground mt-3">
            Point camera at a QR code containing an Ethereum address
          </p>
        )}
      </div>

      {/* Payment Details */}
      <div className="glass p-6 space-y-4">
        <h3 className="font-semibold text-foreground">Payment Details</h3>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Receiver Address
            </label>
            <input
              type="text"
              value={receiverAddress}
              onChange={(e) => setReceiverAddress(e.target.value)}
              placeholder="0x..."
              className="input-glow w-full text-foreground placeholder:text-muted-foreground/50"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Amount (ETH)
            </label>
            <input
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              placeholder="0.001"
              step="0.0001"
              className="input-glow w-full text-foreground placeholder:text-muted-foreground/50"
            />
          </div>
        </div>
      </div>

      {/* Fingerprint Button */}
      <div className="relative flex flex-col items-center py-8">
        <button
          onClick={handleFingerprintClick}
          disabled={!receiverAddress || !paymentAmount}
          className={cn(
            "relative w-28 h-28 rounded-full flex items-center justify-center transition-all duration-300",
            "bg-gradient-to-br from-primary to-secondary",
            "disabled:opacity-40 disabled:cursor-not-allowed",
            !receiverAddress || !paymentAmount ? "" : "animate-pulse-glow"
          )}
        >
          {/* Ripple Effect */}
          {isRippling && (
            <div className="absolute inset-0 rounded-full bg-primary/30 animate-ripple" />
          )}
          
          <Fingerprint className="w-12 h-12 text-primary-foreground" />
        </button>
        
        <p className="mt-4 text-sm font-medium text-muted-foreground">
          Touch to Pay
        </p>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
};

export default ScanPayTab;
