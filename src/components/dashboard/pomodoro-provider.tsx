'use client';

import React, { createContext, useState, ReactNode } from 'react';
import { Task } from '@/lib/types';

interface PomodoroContextType {
  focusedTask: Task | null;
  setFocusedTask: (task: Task | null) => void;
  isTimerActive: boolean;
  setIsTimerActive: React.Dispatch<React.SetStateAction<boolean>>;
}

export const PomodoroContext = createContext<PomodoroContextType>({
  focusedTask: null,
  setFocusedTask: () => {},
  isTimerActive: false,
  setIsTimerActive: () => {},
});

export const PomodoroProvider = ({ children }: { children: ReactNode }) => {
  const [focusedTask, setFocusedTask] = useState<Task | null>(null);
  const [isTimerActive, setIsTimerActive] = useState(false);

  return (
    <PomodoroContext.Provider value={{ focusedTask, setFocusedTask, isTimerActive, setIsTimerActive }}>
      {children}
    </PomodoroContext.Provider>
  );
};
