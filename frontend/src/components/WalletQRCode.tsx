import React from 'react';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, Share2 } from 'lucide-react';
import { useState } from 'react';

interface WalletQRCodeProps {
  address: string;
  size?: number;
  showActions?: boolean;
}

const WalletQRCode: React.FC<WalletQRCodeProps> = ({ 
  address, 
  size = 200,
  showActions = true 
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'My NexPay Wallet',
          text: `Send payments to: ${address}`,
          url: `ethereum:${address}`,
        });
      } else {
        handleCopy();
      }
    } catch (err) {
      console.error('Failed to share:', err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center space-y-4"
    >
      {/* QR Code Container */}
      <div className="relative p-4 bg-white rounded-2xl shadow-elevated">
        <QRCodeSVG
          value={address}
          size={size}
          level="H"
          includeMargin={false}
          bgColor="#ffffff"
          fgColor="#000000"
        />
        
        {/* Logo overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-lg font-bold text-gradient-primary">N</span>
          </div>
        </div>
      </div>

      {/* Address Display */}
      <div className="w-full max-w-xs">
        <p className="text-xs text-muted-foreground text-center mb-2">Your Wallet Address</p>
        <div className="bg-secondary/50 rounded-lg p-3">
          <p className="font-mono text-xs text-foreground break-all text-center">
            {address.substring(0, 6)}...{address.substring(address.length - 6)}
          </p>
        </div>
      </div>

      {/* Actions */}
      {showActions && (
        <div className="flex items-center gap-3">
          <motion.button
            onClick={handleCopy}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-full transition-colors"
          >
            {copied ? (
              <Check className="w-4 h-4 text-success" />
            ) : (
              <Copy className="w-4 h-4 text-foreground" />
            )}
            <span className="text-sm font-medium">
              {copied ? 'Copied!' : 'Copy'}
            </span>
          </motion.button>

          <motion.button
            onClick={handleShare}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full transition-colors"
          >
            <Share2 className="w-4 h-4" />
            <span className="text-sm font-medium">Share</span>
          </motion.button>
        </div>
      )}
    </motion.div>
  );
};

export default WalletQRCode;
