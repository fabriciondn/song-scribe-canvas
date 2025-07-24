import { useState, useEffect } from 'react';
import { adminService } from '@/services/adminService';

export const useAdminAuth = () => {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const hasAccess = await adminService.checkAdminAccess();
        setIsAdmin(hasAccess);
      } catch (error) {
        console.error('Error checking admin access:', error);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminAccess();
  }, []);

  return { isAdmin, isLoading };
};