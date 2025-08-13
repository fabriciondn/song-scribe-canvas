import { supabase } from '@/integrations/supabase/client';

export interface SecurityAuditLog {
  action: 'pii_access' | 'admin_action' | 'impersonation_start' | 'impersonation_end' | 'sensitive_data_export';
  details: Record<string, any>; // More flexible to allow any audit data
  userAgent?: string;
  ipAddress?: string;
}

class SecurityAuditService {
  /**
   * Log security-sensitive actions for compliance and monitoring
   */
  static async log(auditData: SecurityAuditLog): Promise<void> {
    try {
      // Get current user from Supabase session
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.id) {
        console.warn('No authenticated user for security audit log');
        return;
      }

      const { error } = await supabase
        .from('user_activity_logs')
        .insert({
          user_id: user.id,
          action: `security_audit_${auditData.action}`,
          metadata: {
            ...auditData.details,
            timestamp: new Date().toISOString(),
            userAgent: auditData.userAgent || navigator?.userAgent,
            auditLevel: 'HIGH_SECURITY'
          },
          ip_address: auditData.ipAddress
        });

      if (error) {
        console.error('Failed to log security audit:', error);
        // Don't throw error to avoid breaking the main functionality
      } else {
        console.log(`🛡️ Security audit logged: ${auditData.action}`);
      }
    } catch (error) {
      console.error('Error logging security audit:', error);
    }
  }

  /**
   * Log PII access specifically
   */
  static async logPIIAccess(dataType: 'email' | 'cpf' | 'phone', targetData: string): Promise<void> {
    await this.log({
      action: 'pii_access',
      details: {
        dataType,
        targetData: `${dataType}:${targetData.substring(0, 3)}***`, // Only log partial data for audit
        accessTime: new Date().toISOString()
      }
    });
  }

  /**
   * Log admin actions that affect other users
   */
  static async logAdminAction(action: string, targetUserId: string, details?: Record<string, any>): Promise<void> {
    await this.log({
      action: 'admin_action',
      details: {
        adminAction: action,
        targetUserId,
        ...details
      }
    });
  }

  /**
   * Log impersonation events
   */
  static async logImpersonation(action: 'start' | 'end', targetUserId: string, targetUserEmail: string): Promise<void> {
    await this.log({
      action: action === 'start' ? 'impersonation_start' : 'impersonation_end',
      details: {
        impersonatedUserId: targetUserId,
        targetUserEmail: targetUserEmail,
        timestamp: new Date().toISOString()
      }
    });
  }
}

export { SecurityAuditService };