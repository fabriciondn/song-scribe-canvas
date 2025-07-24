import { supabase } from '@/integrations/supabase/client';

export interface AdminDashboardStats {
  total_users: number;
  total_songs: number;
  total_drafts: number;
  total_partnerships: number;
  total_registered_works: number;
  active_users: number;
  total_templates: number;
  total_folders: number;
}

export interface OnlineUser {
  id: string;
  user_id: string;
  session_id: string;
  last_activity: string;
  ip_address: string;
  user_agent: string;
  profile?: {
    name: string;
    email: string;
  };
}

export interface CertificateTemplate {
  id: string;
  name: string;
  description: string;
  design_data: any;
  is_active: boolean;
  is_default: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'super_admin';
  created_at: string;
  last_login?: string;
}

export const adminService = {
  // Check if current user is admin
  async checkAdminAccess(): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('check_admin_access');
      
      if (error) {
        console.error('Error checking admin access:', error);
        return false;
      }

      return data === true;
    } catch (error) {
      console.error('Error checking admin access:', error);
      return false;
    }
  },

  // Get dashboard statistics
  async getDashboardStats(): Promise<AdminDashboardStats> {
    const { data, error } = await supabase.rpc('get_admin_dashboard_stats');
    
    if (error) {
      console.error('Error fetching dashboard stats:', error);
      throw new Error('Erro ao carregar estatísticas do dashboard');
    }

    return data as unknown as AdminDashboardStats;
  },

  // Get online users
  async getOnlineUsers(): Promise<OnlineUser[]> {
    const { data, error } = await supabase
      .from('user_sessions')
      .select(`
        *,
        profiles!inner(name, email)
      `)
      .gte('last_activity', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // Last hour
      .order('last_activity', { ascending: false });

    if (error) {
      console.error('Error fetching online users:', error);
      return [];
    }

    return data.map(session => ({
      ...session,
      profile: session.profiles as any
    }));
  },

  // User management
  async getAllUsers(): Promise<AdminUser[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        name,
        email,
        created_at,
        admin_users(role)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      return [];
    }

    return data.map(user => ({
      id: user.id,
      name: user.name || 'Sem nome',
      email: user.email || 'Sem email',
      role: (user.admin_users as any)?.[0]?.role || 'user',
      created_at: user.created_at
    }));
  },

  async updateUserRole(userId: string, role: 'admin' | 'user'): Promise<void> {
    if (role === 'admin') {
      const { error } = await supabase
        .from('admin_users')
        .upsert({ user_id: userId, role: 'admin' });
      
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('admin_users')
        .delete()
        .eq('user_id', userId);
      
      if (error) throw error;
    }
  },

  async deleteUser(userId: string): Promise<void> {
    // First delete from admin_users if exists
    await supabase
      .from('admin_users')
      .delete()
      .eq('user_id', userId);

    // Then delete from profiles
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (error) throw error;
  },

  // Certificate template management
  async getCertificateTemplates(): Promise<CertificateTemplate[]> {
    const { data, error } = await supabase
      .from('certificate_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching certificate templates:', error);
      return [];
    }

    return data;
  },

  async createCertificateTemplate(template: { name: string; description?: string; design_data?: any; is_active?: boolean }): Promise<CertificateTemplate> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('certificate_templates')
      .insert({
        name: template.name,
        description: template.description || '',
        design_data: template.design_data || {},
        is_active: template.is_active || false,
        is_default: false,
        created_by: user.user.id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateCertificateTemplate(id: string, updates: Partial<CertificateTemplate>): Promise<void> {
    const { error } = await supabase
      .from('certificate_templates')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
  },

  async deleteCertificateTemplate(id: string): Promise<void> {
    const { error } = await supabase
      .from('certificate_templates')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async setDefaultCertificateTemplate(id: string): Promise<void> {
    // First, remove default from all templates
    await supabase
      .from('certificate_templates')
      .update({ is_default: false });

    // Then set the selected template as default
    const { error } = await supabase
      .from('certificate_templates')
      .update({ is_default: true })
      .eq('id', id);

    if (error) throw error;
  },

  // Update user session
  async updateUserSession(): Promise<void> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const sessionId = crypto.randomUUID();
      
      const { error } = await supabase
        .from('user_sessions')
        .upsert({
          user_id: user.user.id,
          session_id: sessionId,
          last_activity: new Date().toISOString(),
          ip_address: '',
          user_agent: navigator.userAgent
        });

      if (error) {
        console.error('Error updating user session:', error);
      }
    } catch (error) {
      console.error('Error in updateUserSession:', error);
    }
  }
};