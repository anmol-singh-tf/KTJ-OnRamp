import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UserPlus, 
  Building2, 
  Shield, 
  CheckCircle2,
  ChevronRight,
  QrCode,
  Fingerprint
} from 'lucide-react';
import FingerprintScanner from '@/components/FingerprintScanner';
import WalletQRCode from '@/components/WalletQRCode';
import KYCVerification from '@/components/KYCVerification';
import { useFingerprintStore } from '@/stores/fingerprintStore';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

type RegistrationStep = 'choose' | 'personal' | 'business' | 'kyc' | 'complete';

const Register: React.FC = () => {
  const [step, setStep] = useState<RegistrationStep>('choose');
  const [userName, setUserName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessDescription, setBusinessDescription] = useState('');
  const [isBusinessRegistration, setIsBusinessRegistration] = useState(false);
  const [kycSubmitted, setKycSubmitted] = useState(false);

  const { 
    walletAddress, 
    isRegistered, 
    setUserName: storeSetUserName, 
    setBusinessInfo,
    setKycVerified,
    setRegistered 
  } = useFingerprintStore();
  const saveRegistration = async ({
    username,
    wallet_address,
    description,
    business_type,
  }: {
    username: string,
    wallet_address: string,
    description: string,
    business_type: string,
  }) => {
    console.log('Saving registration:', { username, wallet_address, description, business_type });
    try {
      
      const res = await fetch(`${BACKEND_URL || ''}/register`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          wallet_address,
          description,
          business_type,
        }),
      });
      if (!res.ok) {
        throw new Error("Failed to register");
      }
      return await res.json();
    } catch (e: any) {
      console.error("Registration API error:", e);
      toast.error('Could not save registration. Please try again.');
      return null;
    }
  };

  const handleFingerprintSuccess = async (privateKey: string, address: string) => {
    console.log('Fingerprint registered:', { address, privateKeyPrefix: privateKey.substring(0, 10) + '...' });
    
    if (step === 'personal') {
      if (userName.trim()) {
        storeSetUserName(userName.trim());
      } 
      setRegistered(true);
      setStep('complete');
      toast.success('Registration successful!');
    } else if (step === 'business') {
      if (userName.trim()) {
        storeSetUserName(userName.trim());
      }
      if (businessName.trim() && businessDescription.trim()) {
        setBusinessInfo(businessName.trim(), businessDescription.trim());
      }
      setRegistered(true);
      setStep('complete');

      if (isBusinessRegistration) {
        const registration_response = await saveRegistration({
          username: userName,
          wallet_address: address,  
          description: businessDescription,
          business_type: 'business',
        });
        console.log('Registration response:', registration_response);
        toast.success('Business registered successfully!');
      } else {
        toast.success('Personal registered successfully!');
      }
    }
  };

  const handleKycSubmit = async () => {
    // Simulate KYC API call
    toast.loading('Submitting KYC...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    setKycVerified(true);
    setKycSubmitted(true);
    toast.dismiss();
    toast.success('KYC submitted successfully!');
   
  };

  const containerVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  // If already registered, show wallet QR
  if (isRegistered && walletAddress && step === 'choose') {
    return (
      <div className="min-h-screen pb-24 px-4 pt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 border border-success/30 mb-4">
              <CheckCircle2 className="w-4 h-4 text-success" />
              <span className="text-sm font-medium text-success">Registered</span>
            </div>
            <h2 className="text-2xl font-display font-bold text-foreground">Your Payment QR</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Share this QR code to receive payments instantly
            </p>
          </div>

          <div className="glass rounded-2xl p-6">
            <WalletQRCode address={walletAddress} />
          </div>

          <div className="glass rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <QrCode className="w-5 h-5 text-primary" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Receive Payments</p>
                <p className="text-xs text-muted-foreground">Anyone can scan to pay you</p>
              </div>
            </div>
          </div>

          {!kycSubmitted && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setStep('kyc')}
              className="w-full flex items-center justify-between px-4 py-4 glass rounded-xl"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <Shield className="w-5 h-5 text-accent" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-foreground">Complete KYC</p>
                  <p className="text-xs text-muted-foreground">Verify your identity for higher limits</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </motion.button>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 px-4 pt-8">
      <AnimatePresence mode="wait">
        {step === 'choose' && (
          <motion.div
            key="choose"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-6"
          >
            <div className="text-center">
              <h2 className="text-2xl font-display font-bold text-foreground">Create Account</h2>
              <p className="text-muted-foreground text-sm mt-1">
                Choose how you want to use NexPay
              </p>
            </div>

            {/* Personal Account */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setIsBusinessRegistration(false);
                setStep('personal');
              }}
              className="w-full glass rounded-xl p-5 text-left space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <UserPlus className="w-6 h-6 text-primary" />
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Personal Account</h3>
                <p className="text-sm text-muted-foreground">
                  Send and receive payments with your biometric wallet
                </p>
              </div>
            </motion.button>

            {/* Business Account */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setIsBusinessRegistration(true);
                setStep('business');
              }}
              className="w-full glass rounded-xl p-5 text-left space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="p-3 bg-accent/10 rounded-xl">
                  <Building2 className="w-6 h-6 text-accent" />
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Business Account</h3>
                <p className="text-sm text-muted-foreground">
                  Accept payments and get listed in our merchant directory
                </p>
              </div>
            </motion.button>
          </motion.div>
        )}

        {step === 'personal' && (
          <motion.div
            key="personal"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-6"
          >
            <button
              onClick={() => setStep('choose')}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back
            </button>

            <div className="text-center">
              <h2 className="text-2xl font-display font-bold text-foreground">Personal Account</h2>
              <p className="text-muted-foreground text-sm mt-1">
                Enter your name and scan your fingerprint
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Your Name
                </label>
                <Input
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Enter your name"
                  className="bg-secondary/50 border-border"
                />
              </div>
            </div>

            <div className="glass rounded-xl p-6">
              <div className="text-center mb-4">
                <Fingerprint className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Scan your fingerprint to create your wallet
                </p>
              </div>
              <FingerprintScanner 
                onSuccess={handleFingerprintSuccess}
                buttonText="Scan to Register"
              />
            </div>
          </motion.div>
        )}

        {step === 'business' && (
          <motion.div
            key="business"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-6"
          >
            <button
              onClick={() => setStep('choose')}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back
            </button>

            <div className="text-center">
              <h2 className="text-2xl font-display font-bold text-foreground">Business Account</h2>
              <p className="text-muted-foreground text-sm mt-1">
                Register your business to accept payments
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Your Name
                </label>
                <Input
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Enter your name"
                  className="bg-secondary/50 border-border"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Business Name
                </label>
                <Input
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Enter business name"
                  className="bg-secondary/50 border-border"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Business Description
                </label>
                <Textarea
                  value={businessDescription}
                  onChange={(e) => setBusinessDescription(e.target.value)}
                  placeholder="Describe your business..."
                  className="bg-secondary/50 border-border resize-none"
                  rows={3}
                />
              </div>
            </div>

            <div className="glass rounded-xl p-6">
              <div className="text-center mb-4">
                <Fingerprint className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Scan fingerprint to create business wallet
                </p>
              </div>
              <FingerprintScanner 
                onSuccess={handleFingerprintSuccess}
                buttonText="Register Business"
              />
            </div>
          </motion.div>
        )}

        {step === 'kyc' && (
          <motion.div
            key="kyc"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <KYCVerification 
              onComplete={() => {
                setKycSubmitted(true);
                setStep('complete');
              }}
              onBack={() => setStep('complete')}
            />
          </motion.div>
        )}

        {step === 'complete' && walletAddress && (
          <motion.div
            key="complete"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-6"
          >
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/20 mb-4"
              >
                <CheckCircle2 className="w-8 h-8 text-success" />
              </motion.div>
              <h2 className="text-2xl font-display font-bold text-foreground">You're All Set!</h2>
              <p className="text-muted-foreground text-sm mt-1">
                Share your QR code to receive payments
              </p>
            </div>

            <div className="glass rounded-2xl p-6">
              <WalletQRCode address={walletAddress} />
            </div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setStep('choose')}
              className="w-full py-3 bg-secondary text-secondary-foreground rounded-xl font-medium"
            >
              Done
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Register;
