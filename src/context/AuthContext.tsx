
// We can't modify this file directly as it's in the read-only list.
// Instead, we'll create a wrapper component to handle the login message

import React, { createContext, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface LoginMessageContextType {
  showLoginMessage: boolean;
  setShowLoginMessage: (show: boolean) => void;
  loginMessageShown: () => void;
}

export const LoginMessageContext = createContext<LoginMessageContextType>({
  showLoginMessage: false,
  setShowLoginMessage: () => {},
  loginMessageShown: () => {},
});

export const LoginMessageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Use localStorage to track if the login message has been shown in this session
  const [showLoginMessage, setShowLoginMessage] = useState<boolean>(() => {
    const shown = localStorage.getItem('login_message_shown');
    return !shown;
  });

  const loginMessageShown = () => {
    localStorage.setItem('login_message_shown', 'true');
    setShowLoginMessage(false);
  };

  return (
    <LoginMessageContext.Provider value={{ showLoginMessage, setShowLoginMessage, loginMessageShown }}>
      {children}
    </LoginMessageContext.Provider>
  );
};
