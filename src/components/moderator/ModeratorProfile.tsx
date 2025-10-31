import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Save, User } from 'lucide-react';
import { toast } from 'sonner';

export function ModeratorProfile() {
  const { user } = useAuth();
  const { profile, updateProfile, uploadAvatar, isLoading } = useProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    artistic_name: profile?.artistic_name || '',
    username: profile?.username || '',
    cpf: profile?.cpf || '',
    cellphone: profile?.cellphone || '',
    birth_date: profile?.birth_date || '',
    cep: profile?.cep || '',
    street: profile?.street || '',
    number: profile?.number || '',
    neighborhood: profile?.neighborhood || '',
    city: profile?.city || '',
    state: profile?.state || '',
  });

  // Sincronizar formData quando profile é carregado
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        artistic_name: profile.artistic_name || '',
        username: profile.username || '',
        cpf: profile.cpf || '',
        cellphone: profile.cellphone || '',
        birth_date: profile.birth_date || '',
        cep: profile.cep || '',
        street: profile.street || '',
        number: profile.number || '',
        neighborhood: profile.neighborhood || '',
        city: profile.city || '',
        state: profile.state || '',
      });
    }
  }, [profile]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      await updateProfile(formData);
      setIsEditing(false);
      toast.success('Perfil atualizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao atualizar perfil');
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        await uploadAvatar(file);
        toast.success('Avatar atualizado com sucesso!');
      } catch (error) {
        toast.error('Erro ao fazer upload do avatar');
      }
    }
  };

  const userInitials = profile?.name 
    ? profile.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.charAt(0).toUpperCase() || 'U';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Perfil do Moderador</h2>
        <p className="text-muted-foreground">
          Gerencie suas informações pessoais e configurações de conta
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informações Pessoais
          </CardTitle>
          <CardDescription>
            Atualize seus dados pessoais e foto de perfil
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback className="text-lg">{userInitials}</AvatarFallback>
            </Avatar>
            <div>
              <Label htmlFor="avatar-upload" className="cursor-pointer">
                <div className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-muted transition-colors">
                  <Camera className="h-4 w-4" />
                  Alterar foto
                </div>
              </Label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Formatos suportados: JPG, PNG, GIF (máx. 5MB)
              </p>
            </div>
          </div>

          {/* Profile Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo *</Label>
              <Input
                id="name"
                value={isEditing ? formData.name : profile?.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                disabled={!isEditing}
                placeholder="Seu nome completo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="artistic_name">Nome Artístico</Label>
              <Input
                id="artistic_name"
                value={isEditing ? formData.artistic_name : profile?.artistic_name || ''}
                onChange={(e) => handleInputChange('artistic_name', e.target.value)}
                disabled={!isEditing}
                placeholder="Seu nome artístico"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cpf">CPF *</Label>
              <Input
                id="cpf"
                value={isEditing ? formData.cpf : profile?.cpf || ''}
                onChange={(e) => handleInputChange('cpf', e.target.value)}
                disabled={!isEditing}
                placeholder="000.000.000-00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cellphone">Telefone *</Label>
              <Input
                id="cellphone"
                value={isEditing ? formData.cellphone : profile?.cellphone || ''}
                onChange={(e) => handleInputChange('cellphone', e.target.value)}
                disabled={!isEditing}
                placeholder="(00) 00000-0000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="birth_date">Data de Nascimento *</Label>
              <Input
                id="birth_date"
                type="date"
                value={isEditing ? formData.birth_date : profile?.birth_date || ''}
                onChange={(e) => handleInputChange('birth_date', e.target.value)}
                disabled={!isEditing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cep">CEP *</Label>
              <Input
                id="cep"
                value={isEditing ? formData.cep : profile?.cep || ''}
                onChange={(e) => handleInputChange('cep', e.target.value)}
                disabled={!isEditing}
                placeholder="00000-000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="street">Endereço *</Label>
              <Input
                id="street"
                value={isEditing ? formData.street : profile?.street || ''}
                onChange={(e) => handleInputChange('street', e.target.value)}
                disabled={!isEditing}
                placeholder="Rua, Avenida, etc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="number">Número</Label>
              <Input
                id="number"
                value={isEditing ? formData.number : profile?.number || ''}
                onChange={(e) => handleInputChange('number', e.target.value)}
                disabled={!isEditing}
                placeholder="123"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="neighborhood">Bairro</Label>
              <Input
                id="neighborhood"
                value={isEditing ? formData.neighborhood : profile?.neighborhood || ''}
                onChange={(e) => handleInputChange('neighborhood', e.target.value)}
                disabled={!isEditing}
                placeholder="Nome do bairro"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">Cidade *</Label>
              <Input
                id="city"
                value={isEditing ? formData.city : profile?.city || ''}
                onChange={(e) => handleInputChange('city', e.target.value)}
                disabled={!isEditing}
                placeholder="Nome da cidade"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">Estado *</Label>
              <Input
                id="state"
                value={isEditing ? formData.state : profile?.state || ''}
                onChange={(e) => handleInputChange('state', e.target.value)}
                disabled={!isEditing}
                placeholder="UF"
                maxLength={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={isEditing ? formData.username : profile?.username || ''}
                onChange={(e) => handleInputChange('username', e.target.value)}
                disabled={!isEditing}
                placeholder="Seu username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={user?.email || ''}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="credits">Créditos</Label>
              <Input
                id="credits"
                value={profile?.credits || 0}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Função</Label>
              <Input
                id="role"
                value="Moderador"
                disabled
                className="bg-muted"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            {!isEditing ? (
              <Button 
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2"
              >
                <User className="h-4 w-4" />
                Editar Perfil
              </Button>
            ) : (
              <>
                <Button 
                  onClick={handleSave}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  Salvar Alterações
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      name: profile?.name || '',
                      artistic_name: profile?.artistic_name || '',
                      username: profile?.username || '',
                      cpf: profile?.cpf || '',
                      cellphone: profile?.cellphone || '',
                      birth_date: profile?.birth_date || '',
                      cep: profile?.cep || '',
                      street: profile?.street || '',
                      number: profile?.number || '',
                      neighborhood: profile?.neighborhood || '',
                      city: profile?.city || '',
                      state: profile?.state || '',
                    });
                  }}
                >
                  Cancelar
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}