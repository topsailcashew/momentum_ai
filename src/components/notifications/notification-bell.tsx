'use client';

import * as React from 'react';
import { Bell, Check, X } from 'lucide-react';
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

export function NotificationBell() {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [isOpen, setIsOpen] = React.useState(false);

  // Set up real-time listener for notifications
  React.useEffect(() => {
    if (user && firestore) {
      const notificationsCol = collection(firestore, 'users', user.uid, 'notifications');
      const q = query(
        notificationsCol,
        where('read', '==', false),
        orderBy('createdAt', 'desc'),
        limit(10)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const unread = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
        setNotifications(unread);
        setUnreadCount(unread.length);
      });

      return unsubscribe;
    }
  }, [user, firestore]);

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
          <h3 className="font-semibold">Notifications</h3>
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
