'use client';

import { useEffect, useState, useCallback } from 'react';

export interface BrowserNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  data?: any;
  onClick?: () => void;
}

export function useBrowserNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check if browser supports notifications
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      console.warn('Browser notifications are not supported');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, [isSupported]);

  const showNotification = useCallback(
    (options: BrowserNotificationOptions) => {
      if (!isSupported) {
        console.warn('Browser notifications are not supported');
        return null;
      }

      if (permission !== 'granted') {
        console.warn('Notification permission not granted');
        return null;
      }

      try {
        const notification = new Notification(options.title, {
          body: options.body,
          icon: options.icon || '/favicon.ico',
          tag: options.tag,
          data: options.data,
          badge: '/favicon.ico',
        });

        if (options.onClick) {
          notification.onclick = (event) => {
            event.preventDefault();
            window.focus();
            options.onClick?.();
            notification.close();
          };
        }

        return notification;
      } catch (error) {
        console.error('Error showing notification:', error);
        return null;
      }
    },
    [isSupported, permission]
  );

  return {
    permission,
    isSupported,
    requestPermission,
    showNotification,
  };
}
