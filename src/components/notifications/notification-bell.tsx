'use client';

import * as React from 'react';
import { Bell, Check, X, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUser, useFirestore } from '@/firebase';
import { getUnreadNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '@/lib/data-firestore';
import type { Notification } from '@/lib/types';
import { collection, onSnapshot, query, where, orderBy, limit } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { useAudio } from '@/hooks/use-audio';
import { useBrowserNotifications } from '@/hooks/use-browser-notifications';

export function NotificationBell() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { play } = useAudio();
  const { showNotification, requestPermission, permission } = useBrowserNotifications();
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [isOpen, setIsOpen] = React.useState(false);
  const prevUnreadCountRef = React.useRef<number>(0);
  const prevNotificationsRef = React.useRef<Notification[]>([]);

  // Set up real-time listener for notifications
  React.useEffect(() => {
    // Wait until user is fully loaded before setting up listeners
    if (user && firestore && !isUserLoading) {
      const notificationsCol = collection(firestore, 'users', user.uid, 'notifications');
      // Simplified query to avoid needing a composite index.
      // We fetch the latest notifications and then filter for unread ones on the client.
      const q = query(
        notificationsCol,
        orderBy('createdAt', 'desc'),
        limit(20) // Fetch a bit more to find unread ones
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const allRecent = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
        const unread = allRecent.filter(n => !n.read);
        
        setNotifications(unread);
        setUnreadCount(unread.length);
      });

      return unsubscribe;
    }
  }, [user, firestore, isUserLoading]);

  // Request notification permission on mount
  React.useEffect(() => {
    if (permission === 'default') {
      requestPermission();
    }
  }, [permission, requestPermission]);

  // Play sound and show browser notification when new notification arrives
  React.useEffect(() => {
    // Find new notifications by comparing with previous state
    const newNotifications = notifications.filter(
      (notif) => !prevNotificationsRef.current.some((prev) => prev.id === notif.id)
    );

    // Only show notifications if this is not the initial load
    if (prevNotificationsRef.current.length > 0 && newNotifications.length > 0) {
      play('notification');

      // Show browser notification for each new notification
      newNotifications.forEach((notif) => {
        showNotification({
          title: notif.title,
          body: notif.message,
          tag: notif.id,
          data: notif,
          onClick: () => {
            if (notif.actionUrl) {
              router.push(notif.actionUrl);
            }
          },
        });
      });
    }

    prevNotificationsRef.current = notifications;
  }, [notifications, play, showNotification, router]);

  const handleNotificationClick = async (notification: Notification) => {
    if (!firestore || !user) return;

    // Mark as read
    await markNotificationAsRead(firestore, user.uid, notification.id);

    // Navigate if action URL provided
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }

    setIsOpen(false);
  };

  const handleMarkAllAsRead = async () => {
    if (!firestore || !user) return;
    await markAllNotificationsAsRead(firestore, user.uid);
  };

  if (!user) return null;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">Notifications</h3>
            {permission === 'denied' && (
              <BellOff className="h-4 w-4 text-muted-foreground" title="Browser notifications blocked" />
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="text-xs"
            >
              Mark all as read
            </Button>
          )}
        </div>
        {permission === 'denied' && (
          <div className="px-4 py-2 bg-muted/50 text-xs text-muted-foreground border-b">
            Browser notifications are blocked. Enable them in your browser settings to receive alerts.
          </div>
        )}
        {permission === 'default' && (
          <div className="px-4 py-2 bg-muted/50 border-b">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">Enable browser notifications?</span>
              <Button
                variant="outline"
                size="sm"
                onClick={requestPermission}
                className="text-xs h-7"
              >
                Enable
              </Button>
            </div>
          </div>
        )}
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No new notifications</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map(notification => (
                <div
                  key={notification.id}
                  className="p-4 hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm">{notification.title}</h4>
                        {!notification.read && (
                          <Badge variant="secondary" className="text-xs">New</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(notification.createdAt), 'MMM d, h:mm a')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
