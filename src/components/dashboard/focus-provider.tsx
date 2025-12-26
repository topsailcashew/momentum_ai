'use client';

import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Task, FocusSession } from '@/lib/types';

interface FocusContextType {
  focusedTask: Task | null;
  setFocusedTask: (task: Task | null) => void;
  isFocusing: boolean;
  focusedTimeMs: number;
  startFocus: () => void;
  pauseFocus: () => void;
  endFocus: () => FocusSession | null;
  resetFocus: () => void;
}

export const FocusContext = createContext<FocusContextType>({
  focusedTask: null,
  setFocusedTask: () => {},
  isFocusing: false,
  focusedTimeMs: 0,
  startFocus: () => {},
  pauseFocus: () => {},
  endFocus: () => null,
  resetFocus: () => {},
});

interface FocusState {
  task: Task | null;
  isActive: boolean;
  startTime: number | null;
  accumulatedMs: number;
}

export const FocusProvider = ({ children }: { children: ReactNode }) => {
  const [focusedTask, setFocusedTaskState] = useState<Task | null>(null);
  const [isFocusing, setIsFocusing] = useState(false);
  const [focusedTimeMs, setFocusedTimeMs] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [accumulatedMs, setAccumulatedMs] = useState(0);

  // Load saved state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('focusState');
    if (saved) {
      try {
        const state: FocusState = JSON.parse(saved);

        if (state.task) {
          setFocusedTaskState(state.task);
          setAccumulatedMs(state.accumulatedMs || 0);

          if (state.isActive && state.startTime) {
            // If was focusing, calculate elapsed time
            const elapsed = Date.now() - state.startTime;
            setAccumulatedMs(state.accumulatedMs + elapsed);
            setStartTime(Date.now()); // Reset start time to now
            setIsFocusing(true);
          }
        }
      } catch (error) {
        console.error('Failed to restore focus state:', error);
        localStorage.removeItem('focusState');
      }
    }
  }, []);

  // Save state to localStorage
  useEffect(() => {
    if (focusedTask) {
      const state: FocusState = {
        task: focusedTask,
        isActive: isFocusing,
        startTime: startTime,
        accumulatedMs: accumulatedMs,
      };
      localStorage.setItem('focusState', JSON.stringify(state));
    } else {
      localStorage.removeItem('focusState');
    }
  }, [focusedTask, isFocusing, startTime, accumulatedMs]);

  // Update timer while focusing
  useEffect(() => {
    if (!isFocusing || !startTime) {
      return;
    }

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setFocusedTimeMs(accumulatedMs + elapsed);
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, [isFocusing, startTime, accumulatedMs]);

  const setFocusedTask = useCallback((task: Task | null) => {
    // If switching tasks, end current focus session
    if (focusedTask && isFocusing) {
      pauseFocus();
    }

    setFocusedTaskState(task);
    setIsFocusing(false);
    setFocusedTimeMs(0);
    setStartTime(null);
    setAccumulatedMs(0);
  }, [focusedTask, isFocusing]);

  const startFocus = useCallback(() => {
    if (!focusedTask) return;

    setStartTime(Date.now());
    setIsFocusing(true);
  }, [focusedTask]);

  const pauseFocus = useCallback(() => {
    if (!isFocusing || !startTime) return;

    const elapsed = Date.now() - startTime;
    setAccumulatedMs(prev => prev + elapsed);
    setFocusedTimeMs(accumulatedMs + elapsed);
    setStartTime(null);
    setIsFocusing(false);
  }, [isFocusing, startTime, accumulatedMs]);

  const endFocus = useCallback((): FocusSession | null => {
    if (!focusedTask) return null;

    // Pause first to calculate final time
    if (isFocusing) {
      pauseFocus();
    }

    const session: FocusSession = {
      startTime: new Date(Date.now() - focusedTimeMs).toISOString(),
      endTime: new Date().toISOString(),
      durationMs: focusedTimeMs,
    };

    // Reset focus state
    setFocusedTimeMs(0);
    setAccumulatedMs(0);
    setStartTime(null);
    setIsFocusing(false);

    return session;
  }, [focusedTask, isFocusing, focusedTimeMs, pauseFocus]);

  const resetFocus = useCallback(() => {
    setFocusedTimeMs(0);
    setAccumulatedMs(0);
    setStartTime(null);
    setIsFocusing(false);
  }, []);

  return (
    <FocusContext.Provider
      value={{
        focusedTask,
        setFocusedTask,
        isFocusing,
        focusedTimeMs,
        startFocus,
        pauseFocus,
        endFocus,
        resetFocus,
      }}
    >
      {children}
    </FocusContext.Provider>
  );
};

// Custom hook to use focus context
export function useFocus() {
  const context = React.useContext(FocusContext);
  if (!context) {
    throw new Error('useFocus must be used within FocusProvider');
  }
  return context;
}
