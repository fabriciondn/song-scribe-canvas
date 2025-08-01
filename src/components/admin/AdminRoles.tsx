import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Plus, Search, Trash2, UserCheck } from 'lucide-react';

interface UserRole {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  profiles?: {
    name?: string;
    email?: string;
    artistic_name?: string;
  };
}

interface Profile {
  id: string;
  name?: string;
  email?: string;
  artistic_name?: string;
}

export const AdminRoles: React.FC = () => {
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedRole, setSelectedRole] = useState('');

  const roles = [
    { value: 'admin', label: 'Administrador', color: 'bg-red-100 text-red-800' },
    { value: 'moderator', label: 'Moderador', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'premium', label: 'Premium', color: 'bg-purple-100 text-purple-800' },
    { value: 'user', label: 'Usuário', color: 'bg-blue-100 text-blue-800' },
  ];

  useEffect(() => {
    fetchUserRoles();
    fetchProfiles();
  }, []);

  const fetchUserRoles = async () => {
    try {
      // Buscar user_roles
      const { data: userRolesData, error: userRolesError } = await supabase
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false });

      if (userRolesError) throw userRolesError;

      // Buscar profiles para os usuários
      const userIds = userRolesData?.map(ur => ur.user_id) || [];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, email, artistic_name')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Combinar os dados
      const combinedData = userRolesData?.map(userRole => ({
        ...userRole,
        profiles: profilesData?.find(profile => profile.id === userRole.user_id)
      })) || [];

      setUserRoles(combinedData);
    } catch (error) {
      console.error('Erro ao buscar funções de usuário:', error);
      toast.error('Erro ao carregar funções de usuário');
    }
  };

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email, artistic_name')
        .order('name');

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Erro ao buscar perfis:', error);
    } finally {
      setLoading(false);
    }
  };

  const assignRole = async () => {
    if (!selectedUser || !selectedRole) {
      toast.error('Selecione um usuário e uma função');
      return;
    }

    try {
      // Verificar se o usuário já tem essa função
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', selectedUser)
        .eq('role', selectedRole)
        .single();

      if (existingRole) {
        toast.error('Este usuário já possui essa função');
        return;
      }

      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: selectedUser,
          role: selectedRole,
          assigned_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) throw error;

      toast.success('Função atribuída com sucesso');
      setSelectedUser('');
      setSelectedRole('');
      fetchUserRoles();
    } catch (error) {
      console.error('Erro ao atribuir função:', error);
      toast.error('Erro ao atribuir função');
    }
  };

  const removeRole = async (roleId: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', roleId);

      if (error) throw error;

      toast.success('Função removida com sucesso');
      fetchUserRoles();
    } catch (error) {
      console.error('Erro ao remover função:', error);
      toast.error('Erro ao remover função');
    }
  };

  const getRoleInfo = (role: string) => {
    return roles.find(r => r.value === role) || { label: role, color: 'bg-gray-100 text-gray-800' };
  };

  const filteredRoles = userRoles.filter(userRole => {
    const profile = userRole.profiles;
    const searchLower = searchTerm.toLowerCase();
    return (
      profile?.name?.toLowerCase().includes(searchLower) ||
      profile?.email?.toLowerCase().includes(searchLower) ||
      profile?.artistic_name?.toLowerCase().includes(searchLower) ||
      userRole.role.toLowerCase().includes(searchLower)
    );
  });

  const availableUsers = profiles.filter(profile => 
    !userRoles.some(ur => ur.user_id === profile.id && ur.role === selectedRole)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gerenciar Funções</h2>
          <p className="text-muted-foreground">Atribua e gerencie funções de usuários</p>
        </div>
      </div>

      {/* Atribuir Nova Função */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Atribuir Nova Função
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Usuário</label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um usuário" />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map((profile) => (
                    <SelectItem key={profile.id} value={profile.id}>
                      {profile.name || profile.artistic_name || profile.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Função</label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma função" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button onClick={assignRole} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Atribuir Função
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Funções */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Funções Atribuídas</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar usuários..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Função</TableHead>
                <TableHead>Data de Atribuição</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRoles.map((userRole) => {
                const roleInfo = getRoleInfo(userRole.role);
                const profile = userRole.profiles;
                
                return (
                  <TableRow key={userRole.id}>
                    <TableCell className="font-medium">
                      {profile?.name || profile?.artistic_name || 'Usuário sem nome'}
                    </TableCell>
                    <TableCell>{profile?.email || 'Email não informado'}</TableCell>
                    <TableCell>
                      <Badge className={roleInfo.color}>
                        {roleInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(userRole.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeRole(userRole.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {filteredRoles.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {searchTerm ? 'Nenhuma função encontrada para o termo pesquisado' : 'Nenhuma função atribuída ainda'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};