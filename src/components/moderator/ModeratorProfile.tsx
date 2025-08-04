import { useState } from 'react';
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
  });

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
              <Label htmlFor="name">Nome Completo</Label>
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