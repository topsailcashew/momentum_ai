// src/components/collaboration/state-transition-card.tsx
'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface StateTransitionCardProps {
  isTransitioning: boolean;
  children: React.ReactNode;
}

export function StateTransitionCard({
  isTransitioning,
  children,
}: StateTransitionCardProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={isTransitioning ? 'transitioning' : 'stable'}
        initial={{ rotateY: 0 }}
        animate={{
          rotateY: isTransitioning ? 90 : 0,
          opacity: isTransitioning ? 0.5 : 1,
        }}
        exit={{ rotateY: 90, opacity: 0 }}
        transition={{
          duration: 0.3,
          ease: 'easeOut',
        }}
        style={{
          transformStyle: 'preserve-3d',
          backfaceVisibility: 'hidden',
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
