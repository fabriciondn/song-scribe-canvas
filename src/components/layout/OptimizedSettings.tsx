
import React, { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useProfile } from '@/hooks/useProfile';
import { Loader2, User, MapPin, CreditCard, Camera, Upload, CheckCircle, XCircle } from 'lucide-react';
import { formatCpf, validateCpf, getCpfErrorMessage } from '@/utils/cpfValidation';

const OptimizedSettings = () => {
  const { profile, isLoading, updateProfile, uploadAvatar } = useProfile();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cpfError, setCpfError] = useState<string | null>(null);
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    artistic_name: profile?.artistic_name || '',
    email: profile?.email || '',
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

  // Atualizar formData quando o profile carrega
  React.useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        artistic_name: profile.artistic_name || '',
        email: profile.email || '',
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

  const fetchAddressByCep = useCallback(async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;

    setIsLoadingCep(true);
    try {
      console.log('🔍 Buscando CEP:', cleanCep);
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();

      if (data.erro) {
        toast.error('CEP não encontrado');
      } else {
        setFormData(prev => ({
          ...prev,
          street: data.logradouro || prev.street,
          neighborhood: data.bairro || prev.neighborhood,
          city: data.localidade || prev.city,
          state: data.uf || prev.state,
        }));
        toast.success('Endereço preenchido automaticamente');
      }
    } catch (error) {
      console.error('❌ Erro ao buscar CEP:', error);
      toast.error('Erro ao buscar CEP');
    } finally {
      setIsLoadingCep(false);
    }
  }, []);

  const handleInputChange = useCallback((field: string, value: string) => {
    // Aplicar formatação automática para CPF
    if (field === 'cpf') {
      const formattedCpf = formatCpf(value);
      setFormData(prev => ({
        ...prev,
        [field]: formattedCpf
      }));
      // Validar CPF em tempo real
      const errorMsg = getCpfErrorMessage(formattedCpf);
      setCpfError(errorMsg);
    } else if (field === 'cep') {
      // Limitar e formatar CEP
      const cleanCep = value.replace(/\D/g, '').slice(0, 8);
      let formattedCep = cleanCep;
      if (cleanCep.length > 5) {
        formattedCep = `${cleanCep.slice(0, 5)}-${cleanCep.slice(5)}`;
      }
      
      setFormData(prev => ({
        ...prev,
        [field]: formattedCep
      }));

      if (cleanCep.length === 8) {
        fetchAddressByCep(cleanCep);
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  }, [fetchAddressByCep]);

  const handleSaveSettings = useCallback(async () => {
    if (!profile) return;
    
    // Validar CPF antes de salvar
    if (formData.cpf && formData.cpf.replace(/\D/g, '').length > 0) {
      const cpfValidationError = getCpfErrorMessage(formData.cpf);
      if (cpfValidationError) {
        setCpfError(cpfValidationError);
        toast.error('CPF inválido. Por favor, corrija antes de salvar.');
        return;
      }
    }
    
    setIsUpdating(true);
    
    try {
      console.log('💾 Salvando configurações:', formData);
      
      await updateProfile(formData);
      
      toast.success('Configurações salvas com sucesso!');
    } catch (error: any) {
      console.error('❌ Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setIsUpdating(false);
    }
  }, [formData, profile, updateProfile]);

  const handleAvatarUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Verificar se é uma imagem
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione um arquivo de imagem válido');
      return;
    }

    // Verificar tamanho (máximo 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 2MB');
      return;
    }

    setIsUploadingAvatar(true);
    
    try {
      const avatarUrl = await uploadAvatar(file);
      toast.success('Foto de perfil atualizada com sucesso!');
    } catch (error: any) {
      console.error('❌ Erro ao fazer upload do avatar:', error);
      toast.error('Erro ao atualizar foto: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setIsUploadingAvatar(false);
      // Limpar o input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [uploadAvatar]);

  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const getUserInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight">Configurações</h2>
        <p className="text-muted-foreground mt-2">
          Gerencie suas informações pessoais e preferências
        </p>
      </div>

      {/* Foto de Perfil */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Foto de Perfil
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          <div className="relative">
            <Avatar className="h-24 w-24">
              <AvatarImage src={profile?.avatar_url} alt="Foto de perfil" />
              <AvatarFallback className="text-lg">
                {getUserInitials(profile?.name)}
              </AvatarFallback>
            </Avatar>
            <Button
              size="sm"
              variant="outline"
              className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
              onClick={triggerFileInput}
              disabled={isUploadingAvatar}
            >
              {isUploadingAvatar ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Upload className="h-3 w-3" />
              )}
            </Button>
          </div>
          <div className="text-center">
            <Button 
              variant="outline" 
              onClick={triggerFileInput}
              disabled={isUploadingAvatar}
            >
              {isUploadingAvatar ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Alterar Foto
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              JPG, PNG ou GIF. Máximo 2MB.
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarUpload}
            className="hidden"
          />
        </CardContent>
      </Card>

      {/* Informações Pessoais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informações Pessoais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Digite seu nome completo"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="artistic_name">Nome Artístico</Label>
              <Input
                id="artistic_name"
                value={formData.artistic_name}
                onChange={(e) => handleInputChange('artistic_name', e.target.value)}
                placeholder="Digite seu nome artístico"
                className="h-11"
              />
            </div>
          </div>
          
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="seu@email.com"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <div className="relative">
                <Input
                  id="cpf"
                  value={formData.cpf}
                  onChange={(e) => handleInputChange('cpf', e.target.value)}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  className={`h-11 pr-10 ${cpfError ? 'border-destructive focus-visible:ring-destructive' : formData.cpf && formData.cpf.replace(/\D/g, '').length === 11 && !cpfError ? 'border-primary focus-visible:ring-primary' : ''}`}
                />
                {formData.cpf && formData.cpf.replace(/\D/g, '').length === 11 && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {cpfError ? (
                      <XCircle className="h-5 w-5 text-destructive" />
                    ) : (
                      <CheckCircle className="h-5 w-5 text-primary" />
                    )}
                  </div>
                )}
              </div>
              {cpfError && (
                <p className="text-sm text-destructive">{cpfError}</p>
              )}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cellphone">Telefone</Label>
              <Input
                id="cellphone"
                value={formData.cellphone}
                onChange={(e) => handleInputChange('cellphone', e.target.value)}
                placeholder="(11) 99999-9999"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="birth_date">Data de Nascimento</Label>
              <Input
                id="birth_date"
                type="date"
                value={formData.birth_date}
                onChange={(e) => handleInputChange('birth_date', e.target.value)}
                className="h-11"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Endereço */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Endereço
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="cep">CEP</Label>
              <Input
                id="cep"
                value={formData.cep}
                onChange={(e) => handleInputChange('cep', e.target.value)}
                placeholder="00000-000"
                className="h-11"
              />
            </div>
            <div className="lg:col-span-2 space-y-2">
              <Label htmlFor="street">Rua</Label>
              <Input
                id="street"
                value={formData.street}
                onChange={(e) => handleInputChange('street', e.target.value)}
                placeholder="Nome da rua"
                className="h-11"
              />
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="number">Número</Label>
              <Input
                id="number"
                value={formData.number}
                onChange={(e) => handleInputChange('number', e.target.value)}
                placeholder="123"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="neighborhood">Bairro</Label>
              <Input
                id="neighborhood"
                value={formData.neighborhood}
                onChange={(e) => handleInputChange('neighborhood', e.target.value)}
                placeholder="Jardim São Domingos"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Cidade</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="São Paulo"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">Estado</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => handleInputChange('state', e.target.value)}
                placeholder="SP"
                className="h-11"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informações da Conta */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Informações da Conta
          </CardTitle>
        </CardHeader>
        <CardContent className="py-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium text-lg">Créditos Disponíveis</p>
              <p className="text-sm text-muted-foreground">
                Seus créditos atuais na plataforma
              </p>
            </div>
            <Badge variant="secondary" className="text-xl px-4 py-2 font-semibold">
              {profile?.credits || 0}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Button 
          onClick={handleSaveSettings}
          disabled={isUpdating || !!cpfError}
          className="min-w-[180px] h-11"
          size="lg"
        >
          {isUpdating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            'Salvar Configurações'
          )}
        </Button>
      </div>
    </div>
  );
};

export default OptimizedSettings;
