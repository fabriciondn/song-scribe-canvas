
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  LayoutDashboard, 
  Music, 
  FileText, 
  Hash, 
  Volume2, 
  Folder, 
  Edit, 
  Users, 
  PlayCircle, 
  Settings, 
  Trash2, 
  Shield, 
  UserCheck,
  User,
  Crown,
  TrendingUp,
  ArrowUp,
  CreditCard,
  BookText,
  Trophy
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ImpersonateButton } from '@/components/ui/impersonate-button';

const iconMap: { [key: string]: any } = {
  LayoutDashboard,
  Music,
  FileText,
  Hash,
  Volume2,
  Folder,
  Edit,
  Users,
  PlayCircle,
  Settings,
  Trash2,
  Shield,
  UserCheck,
  User,
  Crown,
  TrendingUp,
  ArrowUp,
  CreditCard,
  BookText,
  Trophy
};

export const AdminMenuFunctions = () => {
  const [updatingFunction, setUpdatingFunction] = useState<string | null>(null);

  // Buscar funções do sistema
  const { data: functions, isLoading: functionsLoading, refetch: refetchFunctions } = useQuery({
    queryKey: ['menu-functions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menu_functions')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('Erro ao buscar funções:', error);
        throw error;
      }
      
      return data || [];
    },
  });

  // Buscar moderadores (filtrar deletados)
  const { data: moderators, isLoading: moderatorsLoading, refetch: refetchModerators } = useQuery({
    queryKey: ['admin-moderators-list'],
    queryFn: async () => {
      const { data: mods, error } = await supabase
        .from('admin_users')
        .select('user_id, role, created_at')
        .eq('role', 'moderator');
      
      if (error) throw error;
      if (!mods || mods.length === 0) return [];
      
      const userIds = mods.map((m: any) => m.user_id);
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, name, email, avatar_url')
        .in('id', userIds)
        // Filtrar moderadores que não foram deletados
        .not('name', 'like', '%[USUÁRIO EXCLUÍDO]%');
      
      if (profileError) throw profileError;
      
      return mods
        .filter((mod: any) => profiles?.some((p: any) => p.id === mod.user_id))
        .map((mod: any) => ({
          ...mod,
          profile: profiles?.find((p: any) => p.id === mod.user_id) || {},
        }));
    },
  });

  const handleToggleFunction = async (functionKey: string, currentIsHidden: boolean) => {
    setUpdatingFunction(functionKey);
    
    try {
      const newIsHidden = !currentIsHidden;
      
      const { error } = await supabase
        .from('menu_functions')
        .update({ is_hidden: newIsHidden })
        .eq('function_key', functionKey);

      if (error) throw error;

      toast.success(`Função ${newIsHidden ? 'ocultada' : 'mostrada'} com sucesso`);
      refetchFunctions();
    } catch (error) {
      console.error('Erro ao atualizar função:', error);
      toast.error('Erro ao atualizar visibilidade da função');
    } finally {
      setUpdatingFunction(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge variant="default" className="bg-green-500">Disponível</Badge>;
      case 'maintenance':
        return <Badge variant="secondary">Manutenção</Badge>;
      case 'disabled':
        return <Badge variant="destructive">Desabilitado</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'moderator':
        return <Shield className="h-4 w-4 text-blue-500" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  if (functionsLoading || moderatorsLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Seção de Funções do Sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Funções do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {functions?.map((func) => {
              const IconComponent = iconMap[func.icon] || Settings;
              
              return (
                <div key={func.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <IconComponent className="h-5 w-5" />
                    <div className="flex-1">
                      <h4 className="font-medium">{func.name}</h4>
                      <p className="text-sm text-muted-foreground">{func.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    {getStatusBadge(func.status)}
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={!func.is_hidden}
                        onCheckedChange={() => handleToggleFunction(func.function_key, func.is_hidden || false)}
                        disabled={updatingFunction === func.function_key}
                      />
                      <span className="text-sm text-muted-foreground">
                        {!func.is_hidden ? 'Mostrar' : 'Ocultar'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Seção de Moderadores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Moderadores Ativos
            <Badge variant="secondary">{moderators?.length || 0}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {moderators && moderators.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {moderators.map((mod: any) => (
                <div key={mod.user_id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={mod.profile.avatar_url} alt={mod.profile.name} />
                      <AvatarFallback>
                        {mod.profile.name?.[0] || mod.profile.email?.[0] || 'M'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">
                        {mod.profile.name || 'Sem nome'}
                      </h4>
                      <p className="text-sm text-muted-foreground truncate">
                        {mod.profile.email || 'Sem email'}
                      </p>
                    </div>
                    {getRoleIcon(mod.role)}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      Moderador
                    </Badge>
                    <ImpersonateButton
                      targetUser={{
                        id: mod.user_id,
                        name: mod.profile.name,
                        email: mod.profile.email,
                        artistic_name: null
                      }}
                      targetRole="moderator"
                      size="sm"
                      variant="outline"
                    />
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    Criado em: {new Date(mod.created_at).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <UserCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum moderador encontrado</p>
              <p className="text-sm">Crie moderadores na seção "Gestão de Moderadores"</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
