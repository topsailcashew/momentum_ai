// src/components/collaboration/state-transition-dropdown.tsx
'use client';

import * as React from 'react';
import { TaskState, getValidTransitions, TASK_STATE_CONFIGS } from '@/types/task-state';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StateBadge } from './state-badge';

interface StateTransitionDropdownProps {
  currentState: TaskState;
  onStateChange: (newState: TaskState) => void;
  children?: React.ReactNode;
}

export function StateTransitionDropdown({
  currentState,
  onStateChange,
  children,
}: StateTransitionDropdownProps) {
  const validTransitions = getValidTransitions(currentState);

  const getActionLabel = (state: TaskState): string => {
    const labels: Record<TaskState, string> = {
      ready: 'Mark as Ready',
      in_progress: '▶ Start Working',
      waiting: '⏸️ Mark as Waiting',
      review: '👁️ Send for Review',
      done: '✓ Complete',
    };
    return labels[state];
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {children || <StateBadge state={currentState} />}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {validTransitions.map((state) => {
          const config = TASK_STATE_CONFIGS[state];
          return (
            <DropdownMenuItem
              key={state}
              onClick={() => onStateChange(state)}
              className="gap-2"
            >
              <span>{config.icon}</span>
              <span>{getActionLabel(state)}</span>
            </DropdownMenuItem>
          );
        })}
        {validTransitions.length === 0 && (
          <DropdownMenuItem disabled>
            No available transitions
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
