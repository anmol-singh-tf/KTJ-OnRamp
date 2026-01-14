import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, UserPlus, QrCode, MessageCircle } from 'lucide-react';

const navItems = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/register', icon: UserPlus, label: 'Register' },
  { path: '/pay', icon: QrCode, label: 'Pay' },
  { path: '/ai', icon: MessageCircle, label: 'AI' },
];

const BottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-bottom">
      <div className="mx-4 mb-4">
        <motion.div 
          className="glass rounded-2xl shadow-elevated overflow-hidden"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 30 }}
        >
          <div className="flex items-center justify-around py-2 px-4">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;

              return (
                <motion.button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className="relative flex flex-col items-center p-2 min-w-[60px]"
                  whileTap={{ scale: 0.9 }}
                >
                  <AnimatePresence mode="wait">
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-primary/10 rounded-xl"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                  </AnimatePresence>
                  
                  <motion.div
                    animate={{ 
                      scale: isActive ? 1.1 : 1,
                      y: isActive ? -2 : 0 
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  >
                    <Icon 
                      className={`w-5 h-5 transition-colors ${
                        isActive ? 'text-primary' : 'text-muted-foreground'
                      }`}
                    />
                  </motion.div>
                  
                  <motion.span
                    className={`text-xs mt-1 font-medium transition-colors ${
                      isActive ? 'text-primary' : 'text-muted-foreground'
                    }`}
                    animate={{ opacity: isActive ? 1 : 0.7 }}
                  >
                    {item.label}
                  </motion.span>

                  {isActive && (
                    <motion.div
                      className="absolute -top-1 left-1/2 w-1 h-1 rounded-full bg-primary"
                      layoutId="activeDot"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.1 }}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </div>
    </nav>
  );
};

export default BottomNav;
