import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { validateModeratorRegistrationToken, markTokenAsUsed } from '@/services/moderatorTokenService';
import { useAuth } from '@/hooks/useAuth';

const ModeratorAuth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const token = searchParams.get('token');

  // Verificar token na URL
  useEffect(() => {
    const checkToken = async () => {
      if (token) {
        const isValid = await validateModeratorRegistrationToken(token);
        setTokenValid(isValid);
        if (isValid) {
          setMode('register');
        }
      } else {
        setTokenValid(null);
      }
    };

    checkToken();
  }, [token]);

  // Redirecionar se já autenticado
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/moderator');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (mode === 'register') {
        // Validações específicas para registro
        if (!token || !tokenValid) {
          throw new Error('Token de cadastro inválido ou expirado');
        }

        if (formData.password !== formData.confirmPassword) {
          throw new Error('As senhas não coincidem');
        }

        if (formData.password.length < 6) {
          throw new Error('A senha deve ter pelo menos 6 caracteres');
        }

        // Registrar usuário
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              name: formData.name,
              role: 'moderator'
            },
            emailRedirectTo: `${window.location.origin}/moderator`
          }
        });

        if (error) throw error;

        if (data.user) {
          // Criar perfil
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: data.user.id,
              name: formData.name,
              email: formData.email,
              credits: 0
            });

          if (profileError) {
            console.error('Erro ao criar perfil:', profileError);
          }

          // Adicionar como moderador
          const { error: moderatorError } = await supabase
            .from('admin_users')
            .insert({
              user_id: data.user.id,
              role: 'moderator',
              permissions: ['manage_user_credits', 'create_users']
            });

          if (moderatorError) {
            console.error('Erro ao adicionar como moderador:', moderatorError);
          }

          // Marcar token como usado
          await markTokenAsUsed(token, data.user.id);

          toast.success('Conta de moderador criada com sucesso!');
          // Evitar redirecionamento automático imediato após cadastro
          sessionStorage.setItem('skipModeratorRedirect', 'true');
          setTimeout(() => {
            sessionStorage.removeItem('skipModeratorRedirect');
            navigate('/moderator', { replace: true });
          }, 100);
        }
      } else {
        // Login
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password
        });

        if (error) throw error;

        // Verificar se é moderador
        if (data.user) {
          const { data: moderatorData } = await supabase
            .from('admin_users')
            .select('role')
            .eq('user_id', data.user.id)
            .in('role', ['admin', 'moderator'])
            .single();

          if (!moderatorData) {
            await supabase.auth.signOut();
            throw new Error('Acesso negado. Esta área é restrita a moderadores e administradores.');
          }

          toast.success('Login realizado com sucesso!');
          // Evitar redirecionamento automático imediato após login
          sessionStorage.setItem('skipModeratorRedirect', 'true');
          setTimeout(() => {
            sessionStorage.removeItem('skipModeratorRedirect');
            navigate('/moderator', { replace: true });
          }, 100);
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      setError(error.message || 'Erro na autenticação');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Shield className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">
            {mode === 'register' ? 'Cadastro de Moderador' : 'Acesso de Moderador'}
          </CardTitle>
          <CardDescription>
            {mode === 'register' 
              ? 'Complete seu cadastro para acessar o painel de moderação'
              : 'Entre com suas credenciais de moderador'
            }
          </CardDescription>
          
          {token && (
            <div className="mt-4">
              {tokenValid === true && (
                <Badge className="flex items-center space-x-1 bg-green-100 text-green-800 border-green-200">
                  <CheckCircle className="h-3 w-3" />
                  <span>Token válido</span>
                </Badge>
              )}
              {tokenValid === false && (
                <Badge variant="destructive" className="flex items-center space-x-1">
                  <AlertTriangle className="h-3 w-3" />
                  <span>Token inválido ou expirado</span>
                </Badge>
              )}
            </div>
          )}
        </CardHeader>

        <CardContent>
          {error && (
            <Alert className="mb-6" variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                  disabled={isSubmitting}
                  placeholder="Seu nome completo"
                />
              </div>
            )}

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
                disabled={isSubmitting}
                placeholder="seu.email@exemplo.com"
              />
            </div>

            <div>
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                required
                disabled={isSubmitting}
                placeholder="Sua senha"
                minLength={6}
              />
            </div>

            {mode === 'register' && (
              <div>
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  required
                  disabled={isSubmitting}
                  placeholder="Confirme sua senha"
                  minLength={6}
                />
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || (mode === 'register' && !tokenValid)}
            >
              {isSubmitting 
                ? (mode === 'register' ? 'Criando conta...' : 'Entrando...') 
                : (mode === 'register' ? 'Criar Conta de Moderador' : 'Entrar')
              }
            </Button>
          </form>

          {!token && (
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                className="text-sm text-primary hover:underline"
                disabled={isSubmitting}
              >
                {mode === 'login' 
                  ? 'Tem um token de cadastro? Clique aqui' 
                  : 'Já tem uma conta? Fazer login'
                }
              </button>
            </div>
          )}

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="text-sm text-muted-foreground hover:underline"
            >
              Voltar para área de usuários
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ModeratorAuth;