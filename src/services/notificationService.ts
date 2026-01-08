import { supabase } from '@/integrations/supabase/client';

/**
 * Tipos de notificação do sistema
 * - feature: Nova funcionalidade implementada
 * - fix: Correção de bug
 * - update: Atualização do sistema (requer refresh)
 * - announcement: Anúncio geral
 */
export type NotificationType = 'feature' | 'fix' | 'update' | 'announcement';

interface CreateNotificationParams {
  title: string;
  description?: string;
  type: NotificationType;
}

/**
 * Serviço de Notificações do Sistema
 * 
 * IMPORTANTE: Este serviço deve ser usado para notificar usuários sobre:
 * - Novas funcionalidades implementadas (type: 'feature')
 * - Correções de bugs (type: 'fix')
 * - Atualizações do sistema (type: 'update')
 * - Anúncios gerais (type: 'announcement')
 * 
 * Todas as implementações, melhorias e correções DEVEM criar uma notificação
 * para manter os usuários informados sobre as mudanças no sistema.
 */
export const notificationService = {
  /**
   * Cria uma nova notificação do sistema
   * Esta notificação aparecerá no sino de notificações para todos os usuários
   */
  async create({ title, description, type }: CreateNotificationParams): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('system_notifications')
        .insert({
          title,
          description,
          type,
          is_active: true
        });

      if (error) {
        console.error('Erro ao criar notificação:', error);
        return false;
      }

      console.log(`✅ Notificação criada: [${type}] ${title}`);
      return true;
    } catch (error) {
      console.error('Erro ao criar notificação:', error);
      return false;
    }
  },

  /**
   * Notifica sobre uma nova funcionalidade implementada
   */
  async notifyFeature(title: string, description?: string): Promise<boolean> {
    return this.create({ title, description, type: 'feature' });
  },

  /**
   * Notifica sobre uma correção de bug
   */
  async notifyFix(title: string, description?: string): Promise<boolean> {
    return this.create({ title, description, type: 'fix' });
  },

  /**
   * Notifica sobre uma atualização do sistema
   * Este tipo mostra um botão "Atualizar agora" para o usuário
   */
  async notifyUpdate(title: string, description?: string): Promise<boolean> {
    return this.create({ title, description, type: 'update' });
  },

  /**
   * Notifica sobre um anúncio geral
   */
  async notifyAnnouncement(title: string, description?: string): Promise<boolean> {
    return this.create({ title, description, type: 'announcement' });
  },

  /**
   * Lista todas as notificações ativas
   */
  async listActive(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('system_notifications')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao listar notificações:', error);
      return [];
    }
  },

  /**
   * Desativa uma notificação (não aparece mais para novos usuários)
   */
  async deactivate(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('system_notifications')
        .update({ is_active: false })
        .eq('id', notificationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erro ao desativar notificação:', error);
      return false;
    }
  }
};

/**
 * INSTRUÇÕES DE USO:
 * 
 * Sempre que uma implementação, melhoria ou correção for feita,
 * deve-se criar uma notificação usando este serviço.
 * 
 * Exemplos:
 * 
 * // Nova funcionalidade
 * await notificationService.notifyFeature(
 *   'Página de Tutoriais',
 *   'Nova página de tutoriais com design atualizado e guias práticos.'
 * );
 * 
 * // Correção de bug
 * await notificationService.notifyFix(
 *   'Correção de ícones',
 *   'Os ícones da página de tutoriais agora são exibidos corretamente.'
 * );
 * 
 * // Atualização do sistema
 * await notificationService.notifyUpdate(
 *   'Atualização disponível',
 *   'Uma nova versão do aplicativo está disponível. Clique para atualizar.'
 * );
 * 
 * // Anúncio geral
 * await notificationService.notifyAnnouncement(
 *   'Manutenção programada',
 *   'O sistema estará em manutenção das 2h às 4h.'
 * );
 */

export default notificationService;
