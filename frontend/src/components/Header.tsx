import React from 'react';
import { motion } from 'framer-motion';
import ThemeToggle from './ThemeToggle';
import { useFingerprintStore } from '@/stores/fingerprintStore';
import { Wallet, Shield } from 'lucide-react';

const Header: React.FC = () => {
  const { walletAddress, isRegistered, userName } = useFingerprintStore();

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <motion.header 
      className="sticky top-0 z-40 glass"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between px-4 py-3">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center glow">
            <span className="text-lg font-bold text-primary-foreground">N</span>
          </div>
          <div>
            <h1 className="text-lg font-display font-bold text-foreground">NexPay</h1>
            {userName && (
              <p className="text-xs text-muted-foreground">Hello, {userName}</p>
            )}
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {isRegistered && walletAddress && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary rounded-full"
            >
              <Wallet className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-mono text-foreground">
                {shortenAddress(walletAddress)}
              </span>
            </motion.div>
          )}
          <ThemeToggle />
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
