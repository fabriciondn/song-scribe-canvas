import { useGlobalRegistrationNotifications } from '@/hooks/useGlobalRegistrationNotifications';

export const GlobalNotifications = () => {
  useGlobalRegistrationNotifications();
  return null; // Este componente não renderiza nada, apenas executa o hook
};