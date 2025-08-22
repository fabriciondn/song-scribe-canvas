import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Copy, Check, UserPlus, Mail, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CreateModeratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface CredentialsData {
  email: string;
  password: string;
  name: string;
}

export const CreateModeratorModal: React.FC<CreateModeratorModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess 
}) => {
  const [step, setStep] = useState<'form' | 'credentials'>('form');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<CredentialsData | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    credits: '500' // Créditos iniciais para moderador
  });

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, password }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);

    try {
      // Obter o token JWT do usuário autenticado
      const session = supabase.auth.getSession && (await supabase.auth.getSession()).data.session;
      const accessToken = session?.access_token;
      // Chamar a edge function para criar o moderador, enviando o token no header
      const { data, error } = await supabase.functions.invoke('create-user-by-admin', {
        body: {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: 'moderator',
          credits: parseInt(formData.credits) || 500
        },
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

      if (error) {
        throw error;
      }

      // Salvar credenciais para mostrar na próxima tela
      setCredentials({
        email: formData.email,
        password: formData.password,
        name: formData.name
      });

      // Ir para tela de credenciais
      setStep('credentials');
      toast.success('Moderador criado com sucesso!');

    } catch (error: any) {
      console.error('Erro ao criar moderador:', error);
      toast.error(error.message || 'Erro ao criar moderador');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      toast.success('Copiado para área de transferência');
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      credits: '500'
    });
    setCredentials(null);
    setStep('form');
    setCopiedField(null);
    setShowPassword(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
    if (onSuccess && credentials) {
      onSuccess();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            {step === 'form' ? 'Criar Novo Moderador' : 'Credenciais do Moderador'}
          </DialogTitle>
        </DialogHeader>

        {step === 'form' ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nome do moderador"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@exemplo.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha *</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Digite a senha"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={generatePassword}
                  className="px-3"
                >
                  <RefreshCw className="h-4 w-4" />
                  Gerar
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="credits">Créditos Iniciais</Label>
              <Input
                id="credits"
                type="number"
                value={formData.credits}
                onChange={(e) => setFormData(prev => ({ ...prev, credits: e.target.value }))}
                placeholder="500"
                min="0"
              />
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Informações Importantes:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• O moderador terá permissão para criar e gerenciar usuários</li>
                <li>• Ele poderá transferir créditos para os usuários que criar</li>
                <li>• O moderador receberá {formData.credits || '500'} créditos iniciais</li>
                <li>• O email será usado para login na plataforma</li>
              </ul>
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Criando...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Criar Moderador
                  </>
                )}
              </Button>
            </div>
          </form>
        ) : (
          credentials && (
            <div className="space-y-6">
              <Card className="border-green-500/20 bg-green-500/5">
                <CardHeader>
                  <CardTitle className="text-green-500 flex items-center gap-2">
                    <Check className="h-5 w-5" />
                    Moderador Criado com Sucesso!
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    O moderador <strong>{credentials.name}</strong> foi criado com sucesso. 
                    Abaixo estão as credenciais de acesso:
                  </p>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">EMAIL</Label>
                        <p className="font-medium">{credentials.email}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(credentials.email, 'email')}
                      >
                        {copiedField === 'email' ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">SENHA</Label>
                        <p className="font-medium font-mono">{credentials.password}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(credentials.password, 'password')}
                      >
                        {copiedField === 'password' ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-lg">
                    <p className="text-sm text-orange-600 dark:text-orange-400">
                      <strong>Importante:</strong> Copie e envie essas credenciais para o moderador de forma segura. 
                      Esta é a única vez que a senha será exibida em texto simples.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      <Mail className="h-3 w-3 mr-1" />
                      Moderador
                    </Badge>
                    <Badge variant="outline">
                      500 créditos iniciais
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button onClick={handleClose}>
                  <Check className="h-4 w-4 mr-2" />
                  Concluir
                </Button>
              </div>
            </div>
          )
        )}
      </DialogContent>
    </Dialog>
  );
};