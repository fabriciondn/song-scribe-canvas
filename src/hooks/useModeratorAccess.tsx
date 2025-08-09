import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useModeratorAccess = () => {
  const [isModerator, setIsModerator] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    const checkModeratorAccess = async () => {
      console.log('🔍 useModeratorAccess - Iniciando verificação...');
      console.log('📊 Estado da autenticação:', { isAuthenticated, userId: user?.id });
      
      if (!isAuthenticated || !user?.id) {
        console.log('❌ Usuário não autenticado ou sem ID');
        setIsModerator(false);
        setIsLoading(false);
        return;
      }

      try {
        console.log('🔎 Verificando role usando RPC get_user_role...');
        
        // Usar a função RPC para verificar o role
        const { data: roleData, error: roleError } = await supabase
          .rpc('get_user_role', { user_id: user.id });
        
        console.log('📋 Resultado da consulta role:', { roleData, roleError });
        
        if (roleError) {
          console.error('❌ Erro ao verificar role:', roleError);
          // Fallback para verificação direta na tabela
          console.log('🔄 Tentando fallback para verificação direta...');
          
          const { data, error } = await supabase
            .from('admin_users')
            .select('role')
            .eq('user_id', user.id)
            .or('role.eq.moderator,role.eq.admin,role.eq.super_admin')
            .single();
          
          console.log('📋 Resultado da consulta fallback:', { data, error });
          
          if (error && error.code !== 'PGRST116') { // PGRST116 = No rows found
            console.error('❌ Erro no fallback:', error);
            setIsModerator(false);
          } else if (data && ['moderator', 'admin', 'super_admin'].includes(data.role)) {
            console.log('✅ Usuário tem privilégios de moderador (fallback)');
            setIsModerator(true);
          } else {
            console.log('❌ Usuário não tem privilégios de moderador');
            setIsModerator(false);
          }
        } else {
          // Verificar se o role é moderador, admin ou super_admin
          const isMod = ['moderator', 'admin', 'super_admin'].includes(roleData);
          console.log(`${isMod ? '✅' : '❌'} Resultado da verificação:`, { role: roleData, isModerator: isMod });
          setIsModerator(isMod);
        }
      } catch (error) {
        console.error('❌ Erro inesperado ao verificar acesso moderador:', error);
        setIsModerator(false);
      } finally {
        setIsLoading(false);
      }
    };

    // Adicionar debounce para evitar chamadas excessivas
    const timeoutId = setTimeout(checkModeratorAccess, 100);
    
    return () => clearTimeout(timeoutId);
  }, [isAuthenticated, user?.id]);

  return { isModerator, isLoading };
};