import React, { useState, useEffect, useCallback } from 'react';
import { X, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NotificationProps {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  duration?: number;
  onClick?: () => void;
  onClose?: (id: string) => void;
}

export const Notification: React.FC<NotificationProps> = ({
  id,
  title,
  message,
  type = 'info',
  duration = 5000,
  onClick,
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.(id);
    }, 300);
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
      handleClose();
    }
  };

  if (!isVisible) return null;

  const typeStyles = {
    success: 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800',
    info: 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800',
    warning: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800',
    error: 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
  };

  const iconStyles = {
    success: 'text-green-600 dark:text-green-400',
    info: 'text-blue-600 dark:text-blue-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    error: 'text-red-600 dark:text-red-400'
  };

  const textStyles = {
    success: 'text-green-800 dark:text-green-200',
    info: 'text-blue-800 dark:text-blue-200',
    warning: 'text-yellow-800 dark:text-yellow-200',
    error: 'text-red-800 dark:text-red-200'
  };

  return (
    <div
      className={`fixed top-4 right-4 z-50 w-96 max-w-sm p-4 border rounded-lg shadow-lg transition-all duration-300 transform ${
        isAnimating ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'
      } ${typeStyles[type]} ${onClick ? 'cursor-pointer hover:shadow-xl' : ''}`}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        {type === 'success' && (
          <CheckCircle className={`h-5 w-5 mt-0.5 ${iconStyles[type]}`} />
        )}
        
        <div className="flex-1 min-w-0">
          <h4 className={`text-sm font-medium ${textStyles[type]}`}>
            {title}
          </h4>
          <p className={`text-sm mt-1 ${textStyles[type]} opacity-80`}>
            {message}
          </p>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleClose();
          }}
          className={`h-6 w-6 p-0 ${textStyles[type]} hover:bg-black/10 dark:hover:bg-white/10`}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

interface NotificationContextType {
  notifications: NotificationProps[];
  addNotification: (notification: Omit<NotificationProps, 'id'>) => string;
  removeNotification: (id: string) => void;
}

const NotificationContext = React.createContext<NotificationContextType | null>(null);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationProps[]>([]);

  const addNotification = useCallback((notification: Omit<NotificationProps, 'id'>) => {
    const id = Date.now().toString();
    const newNotification = { ...notification, id };
    
    setNotifications(prev => [...prev, newNotification]);
    return id;
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
      {children}
      <div className="fixed top-0 right-0 z-50 p-4 space-y-2">
        {notifications.map(notification => (
          <Notification
            key={notification.id}
            {...notification}
            onClose={removeNotification}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = React.useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};