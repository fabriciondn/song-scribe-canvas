import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { initializePresence, updatePresencePage, cleanupPresence } from '@/services/realtimePresenceService';

export const useVisitorPresence = () => {
  const location = useLocation();
  const { user } = useAuth();
  const initialized = useRef(false);

  useEffect(() => {
    const setupPresence = async () => {
      if (!initialized.current) {
        await initializePresence(location.pathname, user?.id);
        initialized.current = true;
      } else {
        await updatePresencePage(location.pathname, user?.id);
      }
    };

    setupPresence();
  }, [location.pathname, user?.id]);

  useEffect(() => {
    return () => {
      cleanupPresence();
    };
  }, []);
};
