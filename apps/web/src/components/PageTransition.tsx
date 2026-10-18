import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { pageTransitionVariants } from '../lib/motion';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export const PageTransition: React.FC<PageTransitionProps> = ({ children, className }) => {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return (
      <div
        className={className}
        style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%' }}
      >
        {children}
      </div>
    );
  }

  return (
    <motion.div
      className={className}
      variants={pageTransitionVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
      }}
    >
      {children}
    </motion.div>
  );
};
