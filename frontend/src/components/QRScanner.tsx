import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScan, onClose, isOpen }) => {
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerDivId = 'qr-reader';

  useEffect(() => {
    if (isOpen) {
      startScanner();
    }
    return () => {
      stopScanner();
    };
  }, [isOpen]);

  const startScanner = async () => {
    try {
      setError(null);
      
      const html5QrCode = new Html5Qrcode(scannerDivId);
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          console.log('QR Code scanned:', decodedText);
          onScan(decodedText);
          stopScanner();
        },
        (errorMessage) => {
          // Ignore scan errors (they happen every frame without a QR code)
        }
      );
      
      setHasPermission(true);
    } catch (err) {
      console.error('Scanner error:', err);
      setHasPermission(false);
      setError('Camera access denied. Please allow camera permissions.');
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
      scannerRef.current = null;
    }
  };

  const handleClose = () => {
    stopScanner();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-background/95 backdrop-blur-lg"
        >
          <div className="flex flex-col items-center justify-center min-h-screen p-4">
            {/* Header */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Scan QR Code</h2>
              <button
                onClick={handleClose}
                className="p-2 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
              >
                <X className="w-5 h-5 text-foreground" />
              </button>
            </div>

            {/* Scanner Area */}
            <div className="w-full max-w-sm aspect-square relative">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full h-full rounded-2xl overflow-hidden border-2 border-primary/30 relative"
              >
                <div id={scannerDivId} className="w-full h-full" />
                
                {/* Scanning overlay */}
                <div className="absolute inset-0 pointer-events-none">
                  {/* Corner markers */}
                  <div className="absolute top-4 left-4 w-12 h-12 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                  <div className="absolute top-4 right-4 w-12 h-12 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                  <div className="absolute bottom-4 left-4 w-12 h-12 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                  <div className="absolute bottom-4 right-4 w-12 h-12 border-b-4 border-r-4 border-primary rounded-br-lg" />
                  
                  {/* Scan line */}
                  <motion.div
                    className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent"
                    animate={{ top: ['20%', '80%', '20%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  />
                </div>
              </motion.div>

              {/* Error message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute inset-0 flex items-center justify-center bg-background/90 rounded-2xl"
                >
                  <div className="text-center p-4">
                    <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-2" />
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Instructions */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-sm text-muted-foreground text-center mt-6"
            >
              Position the QR code within the frame to scan
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default QRScanner;
