import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useAdminAccess = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    const checkAdminAccess = async () => {
      console.log('🔍 Verificando acesso admin...');
      console.log('📊 Estado da autenticação:', { isAuthenticated, user: user?.id });
      
      if (!isAuthenticated || !user) {
        console.log('❌ Usuário não autenticado');
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      try {
        console.log('🔎 Verificando se usuário é admin diretamente na tabela...');
        
        // Verificar diretamente na tabela admin_users usando o ID do usuário
        const { data, error } = await supabase
          .from('admin_users')
          .select('role')
          .eq('user_id', user.id)
          .single();
        
        console.log('📋 Resultado da consulta admin:', { data, error });
        
        if (error && error.code !== 'PGRST116') { // PGRST116 = No rows found
          console.error('❌ Erro ao verificar acesso admin:', error);
          setIsAdmin(false);
        } else if (data) {
          console.log('✅ Usuário é admin com role:', data.role);
          setIsAdmin(true);
        } else {
          console.log('❌ Usuário não encontrado na tabela admin_users');
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('❌ Erro ao verificar acesso admin:', error);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminAccess();
  }, [isAuthenticated, user]);

  return { isAdmin, isLoading };
};