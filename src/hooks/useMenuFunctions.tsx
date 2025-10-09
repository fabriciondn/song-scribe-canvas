import { useState, useEffect } from 'react';
import { menuFunctionService, MenuFunction } from '@/services/menuFunctionService';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

export function useMenuFunctions() {
  const [functions, setFunctions] = useState<MenuFunction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchFunctions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await menuFunctionService.getAllMenuFunctions();
      setFunctions(data);
    } catch (err: any) {
      console.error('Erro ao buscar funções:', err);
      setError(err.message);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar funções do menu',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateFunctionStatus = async (id: string, status: MenuFunction['status']) => {
    try {
      await menuFunctionService.updateFunctionStatus(id, status);
      setFunctions(prev => prev.map(f => f.id === id ? { ...f, status } : f));
      toast({
        title: 'Sucesso',
        description: 'Status da função atualizado com sucesso',
      });
    } catch (err: any) {
      console.error('Erro ao atualizar status:', err);
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar status da função',
        variant: 'destructive',
      });
    }
  };

  const updateFunction = async (id: string, updates: Partial<MenuFunction>) => {
    try {
      await menuFunctionService.updateMenuFunction(id, updates);
      setFunctions(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
      toast({
        title: 'Sucesso',
        description: 'Função atualizada com sucesso',
      });
    } catch (err: any) {
      console.error('Erro ao atualizar função:', err);
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar função',
        variant: 'destructive',
      });
    }
  };

  const createFunction = async (functionData: Omit<MenuFunction, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      await menuFunctionService.createMenuFunction(functionData);
      await fetchFunctions(); // Recarregar dados
      toast({
        title: 'Sucesso',
        description: 'Nova função criada com sucesso',
      });
    } catch (err: any) {
      console.error('Erro ao criar função:', err);
      toast({
        title: 'Erro',
        description: 'Falha ao criar nova função',
        variant: 'destructive',
      });
    }
  };

  const deleteFunction = async (id: string) => {
    try {
      await menuFunctionService.deleteMenuFunction(id);
      await fetchFunctions(); // Recarregar dados
      toast({
        title: 'Sucesso',
        description: 'Função removida com sucesso',
      });
    } catch (err: any) {
      console.error('Erro ao deletar função:', err);
      toast({
        title: 'Erro',
        description: 'Falha ao remover função',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchFunctions();
    
    // Subscription em tempo real para mudanças na tabela menu_functions
    const channel = supabase
      .channel('menu_functions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'menu_functions'
        },
        () => {
          fetchFunctions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    functions,
    loading,
    error,
    updateFunctionStatus,
    updateFunction,
    createFunction,
    deleteFunction,
    refresh: fetchFunctions,
  };
}

// Hook para verificar o status de uma função específica
export function useFunctionStatus(functionKey: string) {
  const [status, setStatus] = useState<string>('available');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        setLoading(true);
        const statusResult = await menuFunctionService.getFunctionStatus(functionKey);
        setStatus(statusResult);
      } catch (error) {
        console.error('Erro ao buscar status da função:', error);
        setStatus('available'); // Fallback para disponível
      } finally {
        setLoading(false);
      }
    };

    if (functionKey) {
      fetchStatus();
    }
  }, [functionKey]);

  return { status, loading };
}