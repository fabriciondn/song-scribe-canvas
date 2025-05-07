
import { useContext } from 'react';
import { LoginMessageContext } from '@/context/AuthContext';

export const useLoginMessage = () => {
  const context = useContext(LoginMessageContext);
  
  if (context === undefined) {
    throw new Error('useLoginMessage must be used within a LoginMessageProvider');
  }
  
  return context;
};
