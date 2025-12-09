'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { TaskState, TASK_STATE_CONFIGS } from '@/types/task-state';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface StateBadgeProps {
  state: TaskState;
  onClick?: () => void;
  className?: string;
}

export function StateBadge({ state, onClick, className }: StateBadgeProps) {
  const config = TASK_STATE_CONFIGS[state];

  // Animation variants
  const animations = {
    pulse: {
      scale: [1, 1.05, 1],
      boxShadow: [
        '0 0 0 0 rgba(59, 130, 246, 0.4)',
        '0 0 0 4px rgba(59, 130, 246, 0)',
        '0 0 0 0 rgba(59, 130, 246, 0)',
      ],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
    breathe: {
      opacity: [1, 0.6, 1],
      scale: [1, 0.98, 1],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
    shimmer: {
      backgroundPosition: ['200% 0', '-200% 0'],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: 'linear',
      },
    },
    none: {},
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.button
            onClick={onClick}
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium',
              'transition-transform hover:scale-110',
              config.color,
              'text-white',
              onClick && 'cursor-pointer',
              className
            )}
            animate={config.animation ? animations[config.animation] : {}}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <span>{config.icon}</span>
            <span>{config.label}</span>
          </motion.button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Current state: {config.label}</p>
          {onClick && <p className="text-xs text-muted-foreground">Click to change</p>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
