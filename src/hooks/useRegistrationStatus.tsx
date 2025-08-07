import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface RegistrationStatus {
  id: string;
  status: string;
  title: string;
  analysis_started_at?: string;
  analysis_completed_at?: string;
}

export const useRegistrationStatus = () => {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState<RegistrationStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Fetch initial data with retry logic
    const fetchRegistrations = async (retries = 3) => {
      try {
        const { data, error } = await supabase
          .from('author_registrations')
          .select('id, status, title, analysis_started_at, analysis_completed_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error && retries > 0) {
          console.warn('Error fetching registrations, retrying...', error);
          setTimeout(() => fetchRegistrations(retries - 1), 2000);
          return;
        }

        if (!error && data) {
          setRegistrations(data);
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to fetch registrations:', error);
        setIsLoading(false);
      }
    };

    fetchRegistrations();

    // Set up real-time subscription
    const channel = supabase
      .channel('registration-status-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'author_registrations',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Registration status updated:', payload);
          
          // Update the specific registration in the state
          setRegistrations(prev => 
            prev.map(reg => 
              reg.id === payload.new.id 
                ? { 
                    ...reg, 
                    status: payload.new.status,
                    analysis_completed_at: payload.new.analysis_completed_at
                  }
                : reg
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const getStatusText = (status: string) => {
    switch (status) {
      case 'em análise':
        return 'Em Análise';
      case 'registered':
        return 'Registrada';
      case 'draft':
        return 'Rascunho';
      default:
        return status;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'em análise':
        return 'secondary' as const;
      case 'registered':
        return 'default' as const;
      case 'draft':
        return 'outline' as const;
      default:
        return 'outline' as const;
    }
  };

  return {
    registrations,
    isLoading,
    getStatusText,
    getStatusVariant,
  };
};