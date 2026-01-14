import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Upload, 
  Camera, 
  CheckCircle2, 
  FileText,
  User,
  CreditCard,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import AnimatedLoader from './AnimatedLoader';

interface KYCVerificationProps {
  onComplete?: () => void;
  onBack?: () => void;
}

type KYCStep = 'intro' | 'document' | 'selfie' | 'processing' | 'complete';

const KYCVerification: React.FC<KYCVerificationProps> = ({ onComplete, onBack }) => {
  const [step, setStep] = useState<KYCStep>('intro');
  const [documentType, setDocumentType] = useState<string>('');
  const [documentUploaded, setDocumentUploaded] = useState(false);
  const [selfieUploaded, setSelfieUploaded] = useState(false);

  const handleDocumentUpload = () => {
    // Simulate upload
    setTimeout(() => {
      setDocumentUploaded(true);
      toast.success('Document uploaded successfully!');
    }, 1500);
  };

  const handleSelfieUpload = () => {
    // Simulate upload
    setTimeout(() => {
      setSelfieUploaded(true);
      toast.success('Selfie captured successfully!');
    }, 1500);
  };

  const handleSubmit = () => {
    setStep('processing');
    
    // Simulate processing
    setTimeout(() => {
      setStep('complete');
      toast.success('KYC verification complete!');
      if (onComplete) onComplete();
    }, 5000);
  };

  const documentTypes = [
    { id: 'passport', label: 'Passport', icon: FileText },
    { id: 'national_id', label: 'National ID', icon: CreditCard },
    { id: 'driving_license', label: 'Driving License', icon: User },
  ];

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        {step === 'intro' && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {onBack && (
              <button
                onClick={onBack}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Back
              </button>
            )}

            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4"
              >
                <Shield className="w-8 h-8 text-primary" />
              </motion.div>
              <h2 className="text-2xl font-display font-bold text-foreground">
                KYC Verification
              </h2>
              <p className="text-muted-foreground text-sm mt-2">
                Complete verification to unlock higher transaction limits
              </p>
            </div>

            {/* Benefits */}
            <div className="glass rounded-xl p-4 space-y-3">
              <h4 className="font-semibold text-foreground">Verified Account Benefits</h4>
              {[
                'Unlimited transaction amount',
                'Access to merchant features',
                'Priority customer support',
                'Exclusive rewards program',
              ].map((benefit, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <span className="text-sm text-muted-foreground">{benefit}</span>
                </motion.div>
              ))}
            </div>

            {/* Security notice */}
            <div className="flex items-start gap-3 p-3 bg-primary/5 rounded-lg">
              <AlertCircle className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">Your data is secure</p>
                <p className="text-xs text-muted-foreground">
                  All documents are encrypted and processed by our AI verification system
                </p>
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setStep('document')}
              className="w-full py-4 bg-gradient-primary text-primary-foreground rounded-xl font-medium"
            >
              Start Verification
            </motion.button>
          </motion.div>
        )}

        {step === 'document' && (
          <motion.div
            key="document"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <button
              onClick={() => setStep('intro')}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back
            </button>

            <div className="text-center">
              <h3 className="text-xl font-display font-bold text-foreground">
                Upload Identity Document
              </h3>
              <p className="text-muted-foreground text-sm mt-1">
                Choose a document type and upload a clear photo
              </p>
            </div>

            {/* Document type selection */}
            <div className="grid grid-cols-3 gap-3">
              {documentTypes.map((doc) => (
                <motion.button
                  key={doc.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setDocumentType(doc.id)}
                  className={`p-4 rounded-xl text-center transition-all ${
                    documentType === doc.id
                      ? 'bg-primary/20 border-2 border-primary'
                      : 'glass border-2 border-transparent'
                  }`}
                >
                  <doc.icon className={`w-6 h-6 mx-auto mb-2 ${
                    documentType === doc.id ? 'text-primary' : 'text-muted-foreground'
                  }`} />
                  <span className={`text-xs font-medium ${
                    documentType === doc.id ? 'text-primary' : 'text-muted-foreground'
                  }`}>
                    {doc.label}
                  </span>
                </motion.button>
              ))}
            </div>

            {/* Upload area */}
            {documentType && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {!documentUploaded ? (
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleDocumentUpload}
                    className="w-full p-8 border-2 border-dashed border-border rounded-xl hover:border-primary transition-colors"
                  >
                    <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm font-medium text-foreground">
                      Tap to upload document
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      JPG, PNG or PDF (max 5MB)
                    </p>
                  </motion.button>
                ) : (
                  <div className="p-4 bg-success/10 border border-success/30 rounded-xl flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-success" />
                    <div>
                      <p className="font-medium text-foreground">Document uploaded</p>
                      <p className="text-xs text-muted-foreground">Ready for verification</p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {documentUploaded && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setStep('selfie')}
                className="w-full py-4 bg-gradient-primary text-primary-foreground rounded-xl font-medium"
              >
                Continue
              </motion.button>
            )}
          </motion.div>
        )}

        {step === 'selfie' && (
          <motion.div
            key="selfie"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <button
              onClick={() => setStep('document')}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back
            </button>

            <div className="text-center">
              <h3 className="text-xl font-display font-bold text-foreground">
                Take a Selfie
              </h3>
              <p className="text-muted-foreground text-sm mt-1">
                We need to verify that you match your document
              </p>
            </div>

            {/* Selfie capture area */}
            {!selfieUploaded ? (
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleSelfieUpload}
                className="w-full aspect-square max-w-xs mx-auto border-2 border-dashed border-border rounded-full hover:border-primary transition-colors flex flex-col items-center justify-center"
              >
                <Camera className="w-12 h-12 text-muted-foreground mb-3" />
                <p className="text-sm font-medium text-foreground">Tap to take photo</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Make sure your face is clearly visible
                </p>
              </motion.button>
            ) : (
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-32 h-32 mx-auto rounded-full bg-success/10 border border-success/30 flex items-center justify-center mb-4"
                >
                  <CheckCircle2 className="w-12 h-12 text-success" />
                </motion.div>
                <p className="font-medium text-foreground">Photo captured!</p>
              </div>
            )}

            {selfieUploaded && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSubmit}
                className="w-full py-4 bg-gradient-primary text-primary-foreground rounded-xl font-medium"
              >
                Submit for Verification
              </motion.button>
            )}
          </motion.div>
        )}

        {step === 'processing' && (
          <motion.div
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="py-12"
          >
            <AnimatedLoader
              messages={[
                'Analyzing your documents...',
                'Running AI verification...',
                'Checking against databases...',
                'Finalizing verification...',
              ]}
              size="lg"
            />
          </motion.div>
        )}

        {step === 'complete' && (
          <motion.div
            key="complete"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8 space-y-6"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-success/20"
            >
              <CheckCircle2 className="w-10 h-10 text-success" />
            </motion.div>

            <div>
              <h3 className="text-2xl font-display font-bold text-foreground">
                Verification Complete!
              </h3>
              <p className="text-muted-foreground mt-2">
                Your account is now fully verified with enhanced limits
              </p>
            </div>

            <div className="glass rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <span className="text-success font-medium">Verified ✓</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Transaction Limit</span>
                <span className="text-foreground font-medium">Unlimited</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Merchant Access</span>
                <span className="text-foreground font-medium">Enabled</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default KYCVerification;
