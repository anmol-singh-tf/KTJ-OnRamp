import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { motion } from 'framer-motion';
import { useThemeStore } from '@/stores/themeStore';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <motion.button
      onClick={toggleTheme}
      className="relative p-2 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
      whileTap={{ scale: 0.95 }}
      aria-label="Toggle theme"
    >
      <motion.div
        initial={false}
        animate={{ rotate: theme === 'dark' ? 0 : 180 }}
        transition={{ duration: 0.3 }}
      >
        {theme === 'dark' ? (
          <Moon className="w-5 h-5 text-primary" />
        ) : (
          <Sun className="w-5 h-5 text-primary" />
        )}
      </motion.div>
    </motion.button>
  );
};

export default ThemeToggle;
