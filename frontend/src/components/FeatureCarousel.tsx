import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import globalTransferImg from '@/assets/global-transfer.png';
import securityShieldImg from '@/assets/security-shield.png';
import instantSpeedImg from '@/assets/instant-speed.png';

const features = [
  {
    id: 1,
    title: 'International Transfers',
    description: 'Send money to 100+ countries instantly with zero hidden fees. No forex charges, no taxes.',
    image: globalTransferImg,
    stat: '0%',
    statLabel: 'Transaction Tax',
  },
  {
    id: 2,
    title: 'Biometric Security',
    description: 'Your fingerprint is your private key. Bank-grade security with military-level encryption.',
    image: securityShieldImg,
    stat: '100%',
    statLabel: 'Secure',
  },
  {
    id: 3,
    title: 'Instant Settlements',
    description: 'Transactions complete in seconds, not days. Real-time confirmations for peace of mind.',
    image: instantSpeedImg,
    stat: '3s',
    statLabel: 'Avg. Time',
  },
];

const FeatureCarousel: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDirection(1);
      setActiveIndex((prev) => (prev + 1) % features.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handlePrev = () => {
    setDirection(-1);
    setActiveIndex((prev) => (prev - 1 + features.length) % features.length);
  };

  const handleNext = () => {
    setDirection(1);
    setActiveIndex((prev) => (prev + 1) % features.length);
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  };

  return (
    <div className="relative overflow-hidden">
      {/* Feature Cards */}
      <div className="relative h-[400px] md:h-[350px]">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={activeIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="absolute inset-0"
          >
            <div className="glass rounded-2xl p-6 h-full flex flex-col md:flex-row items-center gap-6">
              {/* Image */}
              <motion.div 
                className="w-32 h-32 md:w-40 md:h-40 flex-shrink-0"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <img
                  src={features[activeIndex].image}
                  alt={features[activeIndex].title}
                  className="w-full h-full object-contain animate-float"
                />
              </motion.div>

              {/* Content */}
              <div className="flex-1 text-center md:text-left">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <h3 className="text-xl font-display font-bold text-foreground mb-2">
                    {features[activeIndex].title}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    {features[activeIndex].description}
                  </p>
                  
                  {/* Stat */}
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
                    <span className="text-2xl font-display font-bold text-primary">
                      {features[activeIndex].stat}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {features[activeIndex].statLabel}
                    </span>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-center gap-4 mt-4">
        <button
          onClick={handlePrev}
          className="p-2 rounded-full bg-secondary/50 hover:bg-secondary transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>

        {/* Dots */}
        <div className="flex gap-2">
          {features.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setDirection(index > activeIndex ? 1 : -1);
                setActiveIndex(index);
              }}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === activeIndex
                  ? 'w-6 bg-primary'
                  : 'bg-muted hover:bg-muted-foreground'
              }`}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          className="p-2 rounded-full bg-secondary/50 hover:bg-secondary transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-foreground" />
        </button>
      </div>
    </div>
  );
};

export default FeatureCarousel;
