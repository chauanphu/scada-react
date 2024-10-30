'use client';

import { useEffect, useState } from 'react';
import { NEXT_PUBLIC_WS_URL } from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import Cookies from 'js-cookie';
import * as Popover from '@radix-ui/react-popover';
import { Bell } from "lucide-react"; // Bell icon from Lucide

type Notification = {
  id: number;
  type: "INFO" | "CRITICAL" | "WARNING";
  message: string;
};

const NotificationCard = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const token = Cookies.get('token') || '';
    if (!token) return;

    const socket = new WebSocket(`${NEXT_PUBLIC_WS_URL}/notifications?token=${token}`);

    socket.onmessage = (event) => {
      const data: Notification[] = JSON.parse(event.data);
      if (!data) return;
      setNotifications(data);
    };

    return () => {
      socket.close();
    };
  }, []);

  const removeNotification = (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const getNotificationStyle = (type: Notification['type']) => {
    switch (type) {
      case 'INFO':
        return 'bg-blue-100 border-l-4 border-blue-500 text-blue-700';
      case 'CRITICAL':
        return 'bg-red-100 border-l-4 border-red-500 text-red-700';
      case 'WARNING':
        return 'bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700';
      default:
        return 'bg-gray-100 border-l-4 border-gray-500 text-gray-700';
    }
  };

  const visibleNotifications = notifications;

  return (
    <div className="fixed bottom-5 right-5 z-50">
      <Popover.Root>
        <Popover.Trigger asChild>
          <button className="relative bg-gray-800 text-white p-3 rounded-full focus:outline-none" aria-label="Toggle Notifications">
            <Bell size={24} />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {notifications.length}
              </span>
            )}
          </button>
        </Popover.Trigger>
        
        <Popover.Portal>
          <Popover.Content align="end" side="top" className="w-80 max-h-64 p-4 bg-white rounded-lg shadow-lg overflow-y-auto" sideOffset={10}>
            <AnimatePresence>
              {visibleNotifications.map((notification, index) => (
                <motion.div
                  key={index}
                  className={`p-3 mb-2 rounded ${getNotificationStyle(notification.type)} relative`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.3 }}
                >
                  <button
                    className="absolute top-1 right-2 text-xl leading-none focus:outline-none"
                    onClick={() => removeNotification(notification.id)}
                    aria-label="Close Notification"
                  >
                    &times;
                  </button>
                  <strong className="font-semibold">{notification.type}</strong>
                  <p className="mt-1">{notification.message}</p>
                </motion.div>
              ))}
            </AnimatePresence>
            <Popover.Arrow className="fill-white" />
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
};

export default NotificationCard;