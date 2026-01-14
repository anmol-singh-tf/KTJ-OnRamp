import React from 'react';
import { motion } from 'framer-motion';
import { useFingerprintStore } from '@/stores/fingerprintStore';
import { Wallet, ArrowUpRight, ArrowDownLeft, Shield, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import TypewriterText from '@/components/TypewriterText';
import FeatureCarousel from '@/components/FeatureCarousel';
import FAQ from '@/components/FAQ';
import GettingStarted from '@/components/GettingStarted';
import heroPaymentImg from '@/assets/hero-payment.png';
import { ethers } from 'ethers';
import { useQuery } from '@tanstack/react-query';

const SEPOLIA_RPC_URL = import.meta.env.SEPOLIA_RPC_URL||'https://sepolia.infura.io/v3/a1cf6b93c95b4e079a21fa4fca874411';

const getSepoliaBalance = async (address: string): Promise<string> => {
  try {
    // 1. Initialize the Provider (Infura)
    const provider = new ethers.providers.JsonRpcProvider(SEPOLIA_RPC_URL);
    // 2. Fetch balance in Wei
    const balanceWei = await provider.getBalance(address);
    // 3. Convert Wei to readable Ether
    const balanceEth = ethers.utils.formatEther(balanceWei);
    return balanceEth;
  } catch (error) {
    console.error("Error fetching balance:", error);
    return '0.0';
  }
};

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { walletAddress, isRegistered, userName, isBusiness, businessName } = useFingerprintStore();

  const typewriterTexts = [
    'Zero Transaction Fees',
    '100+ Countries Supported',
    'Instant Settlements',
    'Biometric Security',
  ];

  const { data: balance, isLoading } = useQuery({
    queryKey: ['sepoliaBalance', walletAddress],
    queryFn: () => getSepoliaBalance(walletAddress!),
    enabled: !!walletAddress && ethers.utils.isAddress(walletAddress),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Format balance for display
  const displayBalance = balance ? parseFloat(balance).toFixed(4) : '0.0000';

  return (
    <div className="min-h-screen pb-24">
      {/* Hero Section */}
      <motion.div 
        className="relative overflow-hidden bg-gradient-hero px-4 pt-8 pb-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-accent/20 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          {isRegistered ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="glass rounded-2xl p-6 shadow-elevated">
                <p className="text-sm text-muted-foreground mb-1">
                  {isBusiness ? businessName : `Welcome back, ${userName || 'User'}`}
                </p>
                <div className="flex items-baseline gap-2">
                  {isLoading ? (
                    <span className="text-4xl font-display font-bold text-muted-foreground">...</span>
                  ) : (
                    <span className="text-4xl font-display font-bold text-foreground">{displayBalance}</span>
                  )}
                  <span className="text-lg text-muted-foreground">ETH</span>
                </div>
               
                <div className="flex items-center gap-3 mt-6">
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => navigate('/pay')}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-primary text-primary-foreground rounded-xl font-medium">
                    <ArrowUpRight className="w-4 h-4" /> Send
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => navigate('/register')}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-secondary text-secondary-foreground rounded-xl font-medium">
                    <ArrowDownLeft className="w-4 h-4" /> Receive
                  </motion.button>
                </div>
              </div>
              {walletAddress && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                  className="flex items-center gap-2 px-4 py-3 bg-secondary/50 rounded-xl">
                  <Wallet className="w-4 h-4 text-primary" />
                  <span className="font-mono text-sm text-foreground truncate flex-1">{walletAddress}</span>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-6">
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/30">
                <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                <span className="text-sm font-medium text-primary">The Future of Payments</span>
              </motion.div>

              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">
                Pay Globally with
                <br />
                <span className="text-gradient-primary animate-gradient-text">
                  <TypewriterText texts={typewriterTexts} speed={80} />
                </span>
              </h2>

              <p className="text-muted-foreground max-w-sm mx-auto">
                The best app for international transactions with 0 tax. Your fingerprint is your wallet.
              </p>

              {/* Hero Image */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                className="relative max-w-xs mx-auto">
                <img src={heroPaymentImg} alt="NexPay" className="w-full h-auto rounded-2xl shadow-glow-strong" />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent rounded-2xl" />
              </motion.div>

              <motion.button whileTap={{ scale: 0.95 }} onClick={() => navigate('/register')}
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-primary text-primary-foreground rounded-xl font-medium shadow-glow shimmer">
                <Shield className="w-5 h-5" /> Get Started Free
              </motion.button>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Feature Carousel */}
      <div className="px-4 py-8">
        <FeatureCarousel />
      </div>

      {/* Stats */}
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="px-4 py-4">
        <div className="glass rounded-xl p-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-display font-bold text-primary">0%</p>
              <p className="text-xs text-muted-foreground">Tax</p>
            </div>
            <div>
              <p className="text-2xl font-display font-bold text-accent">3s</p>
              <p className="text-xs text-muted-foreground">Settlement</p>
            </div>
            <div>
              <p className="text-2xl font-display font-bold text-success">100+</p>
              <p className="text-xs text-muted-foreground">Countries</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Getting Started */}
      {!isRegistered && (
        <div className="px-4 py-8">
          <GettingStarted />
        </div>
      )}

      {/* FAQ */}
      <div className="px-4 py-8">
        <FAQ />
      </div>
    </div>
  );
};

export default Home;
