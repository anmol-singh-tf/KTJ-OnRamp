import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface AnimatedLoaderProps {
  messages?: string[];
  size?: 'sm' | 'md' | 'lg';
  showProgress?: boolean;
}

const defaultMessages = [
  'Securing your transaction...',
  'Connecting to blockchain...',
  'Verifying identity...',
  'Almost there...',
];

const AnimatedLoader: React.FC<AnimatedLoaderProps> = ({
  messages = defaultMessages,
  size = 'md',
  showProgress = true,
}) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const messageInterval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
    }, 2500);

    return () => clearInterval(messageInterval);
  }, [messages.length]);

  useEffect(() => {
    if (showProgress) {
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 95) return prev;
          return prev + Math.random() * 15;
        });
      }, 500);

      return () => clearInterval(progressInterval);
    }
  }, [showProgress]);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  const ringSize = {
    sm: 32,
    md: 48,
    lg: 64,
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      {/* Animated Rings */}
      <div className={`relative ${sizeClasses[size]}`}>
        {/* Outer ring */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-primary/30"
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />
        
        {/* Middle ring */}
        <motion.div
          className="absolute inset-1 rounded-full border-2 border-primary/50"
          animate={{ rotate: -360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        />
        
        {/* Inner pulsing dot */}
        <motion.div
          className="absolute inset-0 m-auto w-3 h-3 rounded-full bg-primary"
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [1, 0.7, 1],
          }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Orbiting dots */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full bg-primary"
            style={{
              top: '50%',
              left: '50%',
              marginTop: -3,
              marginLeft: -3,
            }}
            animate={{
              x: [0, ringSize[size] / 2 * Math.cos((i * 2 * Math.PI) / 3), 0],
              y: [0, ringSize[size] / 2 * Math.sin((i * 2 * Math.PI) / 3), 0],
              opacity: [0.3, 1, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.3,
            }}
          />
        ))}
      </div>

      {/* Message */}
      <motion.p
        key={currentMessageIndex}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="text-sm text-muted-foreground text-center"
      >
        {messages[currentMessageIndex]}
      </motion.p>

      {/* Progress bar */}
      {showProgress && (
        <div className="w-48 h-1 bg-secondary rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-primary"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(progress, 95)}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      )}
    </div>
  );
};

export default AnimatedLoader;
