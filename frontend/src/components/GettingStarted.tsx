import React from 'react';
import { motion } from 'framer-motion';
import { Fingerprint, QrCode, Send, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const steps = [
  {
    icon: Fingerprint,
    title: 'Register with Fingerprint',
    description: 'Scan your fingerprint to create your unique crypto wallet instantly',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  {
    icon: QrCode,
    title: 'Share Your QR Code',
    description: 'Get your payment QR code to receive money from anyone globally',
    color: 'text-accent',
    bgColor: 'bg-accent/10',
  },
  {
    icon: Send,
    title: 'Scan & Pay',
    description: 'Scan QR codes or enter addresses to send money worldwide instantly',
    color: 'text-success',
    bgColor: 'bg-success/10',
  },
  {
    icon: CheckCircle,
    title: 'Done!',
    description: 'Transactions settle in seconds with zero hidden fees',
    color: 'text-warning',
    bgColor: 'bg-warning/10',
  },
];

const GettingStarted: React.FC = () => {
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="text-center">
        <motion.span
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-3"
        >
          Easy Setup
        </motion.span>
        <h3 className="text-2xl font-display font-bold text-foreground">
          Get Started in 4 Simple Steps
        </h3>
        <p className="text-muted-foreground mt-2">
          No bank account needed. No complex forms. Just your fingerprint.
        </p>
      </div>

      {/* Steps */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="space-y-4"
      >
        {steps.map((step, index) => (
          <motion.div
            key={step.title}
            variants={itemVariants}
            className="relative"
          >
            {/* Connector line */}
            {index < steps.length - 1 && (
              <div className="absolute left-6 top-14 w-0.5 h-8 bg-gradient-to-b from-primary/50 to-transparent" />
            )}

            <div className="glass rounded-xl p-4 flex items-start gap-4 card-hover">
              {/* Step number */}
              <div className="relative">
                <div className={`p-3 rounded-xl ${step.bgColor}`}>
                  <step.icon className={`w-6 h-6 ${step.color}`} />
                </div>
                <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                  {index + 1}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1">
                <h4 className="font-semibold text-foreground">{step.title}</h4>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* CTA */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate('/register')}
        className="w-full py-4 bg-gradient-primary text-primary-foreground rounded-xl font-medium shadow-glow shimmer"
      >
        Start Your Journey
      </motion.button>
    </motion.div>
  );
};

export default GettingStarted;
