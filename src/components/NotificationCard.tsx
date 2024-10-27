'use client';

import { useEffect, useState } from 'react';
import { NEXT_PUBLIC_WS_URL } from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import Cookies from 'js-cookie';

type Notification = {
  id: number;
  type: "INFO" | "CRITICAL" | "WARNING";
  message: string;
}

const NotificationCard = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    // Establish a WebSocket connection
    const token = Cookies.get('token') || '';
    if (!token) {
      return;
    }
    const socket = new WebSocket(`${NEXT_PUBLIC_WS_URL}/notifications?token=${token}`);

    // Handle incoming messages from the WebSocket
    socket.onmessage = (event) => {
      const data: Notification[] = JSON.parse(event.data);
      if (!data) {
        return;
      }
      setNotifications(data);
    };

    // Clean up the WebSocket connection when the component unmounts
    return () => {
      socket.close();
    };
  }, []);

  const removeNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
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

  return (
    <div className="fixed bottom-5 right-5 flex flex-col items-start space-y-4 z-50">
      <AnimatePresence>
        {notifications.map((notification, index) => (
          <motion.div
            key={index}
            className={`w-80 p-4 rounded shadow-lg ${getNotificationStyle(notification.type)} relative`}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ duration: 0.3 }}
          >
            <button
              className="absolute top-2 right-2 text-xl leading-none focus:outline-none"
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
    </div>
  );
};

export default NotificationCard;