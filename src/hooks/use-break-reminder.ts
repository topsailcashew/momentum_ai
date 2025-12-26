import { useEffect, useState, useCallback } from 'react';
import { useToast } from './use-toast';

interface BreakReminderOptions {
  /** Interval in milliseconds to remind about breaks (default: 90 minutes) */
  reminderIntervalMs?: number;
  /** Whether break reminders are enabled */
  enabled?: boolean;
  /** Whether currently focusing on a task */
  isFocusing: boolean;
  /** Callback when user acknowledges break reminder */
  onBreakAcknowledged?: () => void;
}

/**
 * Soft break reminder hook
 * Gently reminds users to take breaks without forcing them
 * Uses toast notifications instead of blocking modals
 */
export function useBreakReminder({
  reminderIntervalMs = 90 * 60 * 1000, // 90 minutes default
  enabled = true,
  isFocusing,
  onBreakAcknowledged,
}: BreakReminderOptions) {
  const { toast } = useToast();
  const [lastReminderAt, setLastReminderAt] = useState<number | null>(null);

  // Show break reminder toast
  const showBreakReminder = useCallback(() => {
    toast({
      title: '💡 Time for a break?',
      description: 'You\'ve been focusing for a while. Consider taking a short break to recharge.',
      duration: 10000, // Show for 10 seconds
      action: {
        label: 'Taking a break',
        onClick: () => {
          onBreakAcknowledged?.();
        },
      },
    });

    setLastReminderAt(Date.now());
  }, [toast, onBreakAcknowledged]);

  // Check if it's time for a reminder
  useEffect(() => {
    if (!enabled || !isFocusing) {
      return;
    }

    // Check every minute if it's time for a reminder
    const checkInterval = setInterval(() => {
      const now = Date.now();

      // If no reminder shown yet, or enough time has passed since last reminder
      if (!lastReminderAt || (now - lastReminderAt >= reminderIntervalMs)) {
        showBreakReminder();
      }
    }, 60 * 1000); // Check every minute

    return () => clearInterval(checkInterval);
  }, [enabled, isFocusing, lastReminderAt, reminderIntervalMs, showBreakReminder]);

  // Reset reminder when user stops focusing
  useEffect(() => {
    if (!isFocusing) {
      setLastReminderAt(null);
    }
  }, [isFocusing]);

  return {
    lastReminderAt,
    showBreakReminder,
  };
}
