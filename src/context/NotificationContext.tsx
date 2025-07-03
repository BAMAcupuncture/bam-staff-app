import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { Notification } from '../types'; // Assuming Notification type is in your types/index.ts

// Define the shape of the context data
interface NotificationContextType {
  notification: Notification | null;
  showNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  hideNotification: () => void;
}

// Create the context
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// This is the custom hook that components will use.
// We are EXPORTING it so other files can import it with { useNotification }.
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

// This is the Provider component that wraps your app.
// We are EXPORTING it so App.tsx can use it.
export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notification, setNotification] = useState<Notification | null>(null);

  const hideNotification = useCallback(() => {
    setNotification(null);
  }, []);

  const showNotification = useCallback((newNotification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const fullNotification: Notification = {
      ...newNotification,
      id: new Date().toISOString(), // Simple unique ID
      timestamp: new Date(),
      read: false
    };
    setNotification(fullNotification);

    // Automatically hide the notification after 5 seconds
    const timer = setTimeout(() => {
      hideNotification();
    }, 5000);

    // Note: In a real app, you might want to clear this timer if a new notification comes in
  }, [hideNotification]);

  const value = { notification, showNotification, hideNotification };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};