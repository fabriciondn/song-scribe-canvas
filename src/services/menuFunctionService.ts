import { supabase } from "@/integrations/supabase/client";

export interface MenuFunction {
  id: string;
  function_key: string;
  name: string;
  description?: string;
  status: 'coming_soon' | 'beta' | 'available';
  icon?: string;
  route?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export const menuFunctionService = {
  // Buscar todas as funções do menu
  async getAllMenuFunctions(): Promise<MenuFunction[]> {
    const { data, error } = await supabase
      .from('menu_functions')
      .select('*')
      .order('name');

    if (error) throw error;
    return (data || []) as MenuFunction[];
  },

  // Buscar status de uma função específica
  async getFunctionStatus(functionKey: string): Promise<string> {
    const { data, error } = await supabase
      .rpc('get_function_status', { p_function_key: functionKey });

    if (error) throw error;
    return data || 'available';
  },

  // Atualizar status de uma função
  async updateFunctionStatus(id: string, status: MenuFunction['status']): Promise<void> {
    const { error } = await supabase
      .from('menu_functions')
      .update({ status })
      .eq('id', id);

    if (error) throw error;
  },

  // Atualizar função completa
  async updateMenuFunction(id: string, updates: Partial<MenuFunction>): Promise<void> {
    const { error } = await supabase
      .from('menu_functions')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
  },

  // Criar nova função
  async createMenuFunction(functionData: Omit<MenuFunction, 'id' | 'created_at' | 'updated_at'>): Promise<MenuFunction> {
    const { data, error } = await supabase
      .from('menu_functions')
      .insert([functionData])
      .select()
      .single();

    if (error) throw error;
    return data as MenuFunction;
  },

  // Deletar função
  async deleteMenuFunction(id: string): Promise<void> {
    const { error } = await supabase
      .from('menu_functions')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};