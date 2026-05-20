import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ApiSetting {
  key: string;
  value: string;
  description: string;
}

export const useApiSettings = () => {
  const [settings, setSettings] = useState<ApiSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('system_settings')
        .select('*');

      if (error) throw error;
      setSettings(data || []);
    } catch (error: any) {
      console.error('Error fetching API settings:', error);
      toast({
        title: 'Erro ao carregar configurações',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = async (key: string, value: string) => {
    try {
      const { error } = await supabase
        .from('system_settings')
        .update({ value, updated_at: new Date().toISOString() })
        .eq('key', key);

      if (error) throw error;

      setSettings(prev => 
        prev.map(s => s.key === key ? { ...s, value } : s)
      );

      return true;
    } catch (error: any) {
      console.error('Error updating setting:', error);
      toast({
        title: 'Erro ao salvar configuração',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    settings,
    isLoading,
    updateSetting,
    refresh: fetchSettings
  };
};
