import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useModeratorAccess = () => {
  const [isModerator, setIsModerator] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    const checkModeratorAccess = async () => {
      console.log('🔍 Verificando acesso moderador...');
      console.log('📊 Estado da autenticação:', { isAuthenticated, user: user?.id });
      
      if (!isAuthenticated || !user) {
        console.log('❌ Usuário não autenticado');
        setIsModerator(false);
        setIsLoading(false);
        return;
      }

      try {
        console.log('🔎 Verificando se usuário é moderador diretamente na tabela...');
        
        // Verificar diretamente na tabela admin_users usando o ID do usuário
        const { data, error } = await supabase
          .from('admin_users')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'moderator')
          .single();
        
        console.log('📋 Resultado da consulta moderador:', { data, error });
        
        if (error && error.code !== 'PGRST116') { // PGRST116 = No rows found
          console.error('❌ Erro ao verificar acesso moderador:', error);
          setIsModerator(false);
        } else if (data) {
          console.log('✅ Usuário é moderador');
          setIsModerator(true);
        } else {
          console.log('❌ Usuário não encontrado na tabela admin_users como moderador');
          setIsModerator(false);
        }
      } catch (error) {
        console.error('❌ Erro ao verificar acesso moderador:', error);
        setIsModerator(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkModeratorAccess();
  }, [isAuthenticated, user]);

  return { isModerator, isLoading };
};