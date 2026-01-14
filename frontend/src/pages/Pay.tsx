import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  QrCode, 
  Keyboard, 
  ArrowRight, 
  CheckCircle2,
  AlertCircle,
  Loader2,
  Fingerprint
} from 'lucide-react';
import { ethers } from 'ethers';
import QRScanner from '@/components/QRScanner';
import FingerprintScanner from '@/components/FingerprintScanner';
import { Input } from '@/components/ui/input';
import { useFingerprintStore } from '@/stores/fingerprintStore';
import { toast } from 'sonner';

type PaymentStep = 'input' | 'amount' | 'confirm' | 'processing' | 'success' | 'error';

const SEPOLIA_RPC = import.meta.env.SEPOLIA_RPC_URL||'https://sepolia.infura.io/v3/a1cf6b93c95b4e079a21fa4fca874411';

const Pay: React.FC = () => {
  const [step, setStep] = useState<PaymentStep>('input');
  const [receiverAddress, setReceiverAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const { privateKey, walletAddress, isRegistered } = useFingerprintStore();

  const handleScan = (data: string) => {
    console.log('Scanned QR:', data);
    // Handle different QR formats
    let address = data;
    if (data.startsWith('ethereum:')) {
      address = data.replace('ethereum:', '').split('@')[0].split('?')[0];
    }
    if (ethers.utils.isAddress(address)) {
      setReceiverAddress(address);
      setShowScanner(false);
      setStep('amount');
      toast.success('Address scanned successfully!');
    } else {
      toast.error('Invalid wallet address');
    }
  };

  const handleManualSubmit = () => {
    if (ethers.utils.isAddress(receiverAddress)) {
      setShowManualInput(false);
      setStep('amount');
    } else {
      toast.error('Invalid wallet address');
    }
  };

  const handleAmountSubmit = () => {
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    setStep('confirm');
  };

  const handleFingerprintSuccess = async () => {
    setStep('processing');
    setIsProcessing(true);

    try {
      const provider = new ethers.providers.JsonRpcProvider(SEPOLIA_RPC);
      
      if (!privateKey) {
        throw new Error('Wallet not authenticated');
      }

      const wallet = new ethers.Wallet(privateKey, provider);
      
      console.log('Sending transaction:', {
        from: wallet.address,
        to: receiverAddress,
        amount: amount,
      });

      const tx = await wallet.sendTransaction({
        to: receiverAddress,
        value: ethers.utils.parseEther(amount),
      });

      console.log('Transaction sent:', tx.hash);
      setTxHash(tx.hash);

      // Wait for confirmation
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);

      setStep('success');
      toast.success('Payment successful!');
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Payment error:', error);
      setErrorMessage(error.message || 'Transaction failed');
      setStep('error');
      toast.error('Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetPayment = () => {
    setStep('input');
    setReceiverAddress('');
    setAmount('');
    setTxHash('');
    setErrorMessage('');
  };

  const containerVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  if (!isRegistered) {
    return (
      <div className="min-h-screen pb-24 px-4 pt-8 flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="p-4 bg-warning/10 rounded-full inline-flex">
            <AlertCircle className="w-8 h-8 text-warning" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">Registration Required</h2>
          <p className="text-muted-foreground text-sm">
            Please register first to make payments
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 px-4 pt-8">
      <AnimatePresence mode="wait">
        {step === 'input' && (
          <motion.div
            key="input"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-6"
          >
            <div className="text-center">
              <h2 className="text-2xl font-display font-bold text-foreground">Scan & Pay</h2>
              <p className="text-muted-foreground text-sm mt-1">
                Scan QR or enter address to send payment
              </p>
            </div>

            {/* Scan QR Button */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowScanner(true)}
              className="w-full glass rounded-xl p-8 text-center space-y-4"
            >
              <div className="w-24 h-24 mx-auto rounded-2xl bg-gradient-primary flex items-center justify-center glow">
                <QrCode className="w-12 h-12 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Scan QR Code</h3>
                <p className="text-sm text-muted-foreground">
                  Point camera at receiver's QR
                </p>
              </div>
            </motion.button>

            {/* Or divider */}
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-border" />
              <span className="text-sm text-muted-foreground">or</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Manual Input Button */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowManualInput(true)}
              className="w-full glass rounded-xl p-5 flex items-center gap-4"
            >
              <div className="p-3 bg-secondary rounded-xl">
                <Keyboard className="w-6 h-6 text-foreground" />
              </div>
              <div className="text-left flex-1">
                <h3 className="font-semibold text-foreground">Enter Address</h3>
                <p className="text-sm text-muted-foreground">Type wallet address manually</p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground" />
            </motion.button>

            {/* Manual Input Modal */}
            <AnimatePresence>
              {showManualInput && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 bg-background/95 backdrop-blur-lg flex items-center justify-center p-4"
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="w-full max-w-sm glass rounded-2xl p-6 space-y-4"
                  >
                    <h3 className="text-lg font-semibold text-foreground">Enter Wallet Address</h3>
                    <Input
                      value={receiverAddress}
                      onChange={(e) => setReceiverAddress(e.target.value)}
                      placeholder="0x..."
                      className="font-mono bg-secondary/50 border-border"
                    />
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowManualInput(false)}
                        className="flex-1 py-3 bg-secondary text-secondary-foreground rounded-xl font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleManualSubmit}
                        className="flex-1 py-3 bg-gradient-primary text-primary-foreground rounded-xl font-medium"
                      >
                        Continue
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {step === 'amount' && (
          <motion.div
            key="amount"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-6"
          >
            <button
              onClick={() => setStep('input')}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back
            </button>

            <div className="text-center">
              <h2 className="text-2xl font-display font-bold text-foreground">Enter Amount</h2>
              <p className="text-muted-foreground text-sm mt-1">
                How much do you want to send?
              </p>
            </div>

            {/* Receiver Info */}
            <div className="glass rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1">Sending to</p>
              <p className="font-mono text-sm text-foreground break-all">
                {receiverAddress}
              </p>
            </div>

            {/* Amount Input */}
            <div className="glass rounded-xl p-6 space-y-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="text-4xl font-display font-bold text-foreground bg-transparent text-center w-40 outline-none"
                    step="0.001"
                    min="0"
                  />
                  <span className="text-xl text-muted-foreground">ETH</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Sepolia Testnet
                </p>
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleAmountSubmit}
              disabled={!amount || parseFloat(amount) <= 0}
              className="w-full py-4 bg-gradient-primary text-primary-foreground rounded-xl font-medium disabled:opacity-50"
            >
              Continue
            </motion.button>
          </motion.div>
        )}

        {step === 'confirm' && (
          <motion.div
            key="confirm"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-6"
          >
            <button
              onClick={() => setStep('amount')}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back
            </button>

            <div className="text-center">
              <h2 className="text-2xl font-display font-bold text-foreground">Confirm Payment</h2>
              <p className="text-muted-foreground text-sm mt-1">
                Verify details and authenticate
              </p>
            </div>

            {/* Transaction Summary */}
            <div className="glass rounded-xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Amount</span>
                <span className="text-xl font-semibold text-foreground">{amount} ETH</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Network</span>
                <span className="text-foreground">Sepolia Testnet</span>
              </div>
              <div className="pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground mb-1">To</p>
                <p className="font-mono text-sm text-foreground break-all">
                  {receiverAddress}
                </p>
              </div>
            </div>

            {/* Fingerprint Authentication */}
            <div className="glass rounded-xl p-6">
              <div className="text-center mb-4">
                <Fingerprint className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Authenticate to confirm payment
                </p>
              </div>
              <FingerprintScanner 
                onSuccess={handleFingerprintSuccess}
                buttonText="Confirm & Pay"
                showResult={false}
                compact
              />
            </div>
          </motion.div>
        )}

        {step === 'processing' && (
          <motion.div
            key="processing"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="min-h-[60vh] flex flex-col items-center justify-center space-y-6"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Loader2 className="w-16 h-16 text-primary" />
            </motion.div>
            <div className="text-center">
              <h2 className="text-xl font-semibold text-foreground">Processing Payment</h2>
              <p className="text-muted-foreground text-sm mt-1">
                Please wait while we confirm your transaction...
              </p>
            </div>
          </motion.div>
        )}

        {step === 'success' && (
          <motion.div
            key="success"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="min-h-[60vh] flex flex-col items-center justify-center space-y-6 px-4"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center"
            >
              <CheckCircle2 className="w-10 h-10 text-success" />
            </motion.div>
            <div className="text-center">
              <h2 className="text-2xl font-display font-bold text-foreground">Payment Sent!</h2>
              <p className="text-muted-foreground text-sm mt-1">
                {amount} ETH has been sent successfully
              </p>
            </div>

            {txHash && (
              <div className="w-full glass rounded-xl p-4">
                <p className="text-xs text-muted-foreground mb-1">Transaction Hash</p>
                <p className="font-mono text-xs text-foreground break-all">
                  {txHash}
                </p>
              </div>
            )}

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={resetPayment}
              className="w-full py-4 bg-gradient-primary text-primary-foreground rounded-xl font-medium"
            >
              Done
            </motion.button>
          </motion.div>
        )}

        {step === 'error' && (
          <motion.div
            key="error"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="min-h-[60vh] flex flex-col items-center justify-center space-y-6 px-4"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="w-20 h-20 rounded-full bg-destructive/20 flex items-center justify-center"
            >
              <AlertCircle className="w-10 h-10 text-destructive" />
            </motion.div>
            <div className="text-center">
              <h2 className="text-2xl font-display font-bold text-foreground">Payment Failed</h2>
              <p className="text-muted-foreground text-sm mt-1">
                {errorMessage || 'Something went wrong'}
              </p>
            </div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={resetPayment}
              className="w-full py-4 bg-secondary text-secondary-foreground rounded-xl font-medium"
            >
              Try Again
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QR Scanner Modal */}
      <QRScanner 
        isOpen={showScanner} 
        onClose={() => setShowScanner(false)} 
        onScan={handleScan} 
      />
    </div>
  );
};

export default Pay;
