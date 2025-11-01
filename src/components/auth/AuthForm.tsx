
import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

type AuthMode = 'login' | 'register';

interface AuthFormProps {
  defaultMode?: AuthMode;
}

export const AuthForm: React.FC<AuthFormProps> = ({ defaultMode = 'login' }) => {
  const [mode, setMode] = useState<AuthMode>(defaultMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  
  const { login, register, loginWithGoogle, resetPassword } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    try {
      if (mode === 'login') {
        await login(email, password);
        toast({
          title: 'Login realizado com sucesso!',
          description: 'Bem-vindo de volta ao Compuse.',
        });
      } else {
        if (!name) {
          throw new Error('Nome é obrigatório');
        }
        await register(name, email, password);
        
        // 🆕 Processar afiliação após signup bem-sucedido
        const affiliateCode = localStorage.getItem('affiliate_code');
        if (affiliateCode) {
          console.log('🔗 Vinculando usuário ao afiliado:', affiliateCode);
          
          try {
            // Importar supabase
            const { supabase } = await import('@/integrations/supabase/client');
            
            // Aguardar um pouco para garantir que o usuário foi criado
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Buscar usuário autenticado
            const { data: { user: newUser } } = await supabase.auth.getUser();
            
            if (newUser) {
              // Buscar ID do afiliado
              const { data: affiliate } = await supabase
                .from('affiliates')
                .select('id')
                .eq('affiliate_code', affiliateCode)
                .eq('status', 'approved')
                .single();
              
              if (affiliate) {
                // Atualizar clique com user_id e marcar como convertido
                await supabase
                  .from('affiliate_clicks')
                  .update({ 
                    user_id: newUser.id,
                    converted: true 
                  })
                  .eq('affiliate_id', affiliate.id)
                  .is('user_id', null)
                  .order('created_at', { ascending: false })
                  .limit(1);
                
                console.log('✅ Clique atualizado com user_id');
              }
            }
          } catch (error) {
            console.error('❌ Erro ao vincular afiliado:', error);
          }
        }
        
        toast({
          title: 'Conta criada com sucesso!',
          description: 'Bem-vindo ao Compuse.',
        });
      }
    } catch (error: any) {
      console.error('Erro na autenticação:', error);
      let errorMessage = 'Ocorreu um erro ao processar sua solicitação';
      
      if (error.message) {
        if (error.message.includes('Email already in use')) {
          errorMessage = 'Este e-mail já está em uso. Por favor, tente outro ou faça login.';
        } else if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'E-mail ou senha incorretos. Por favor, verifique suas credenciais.';
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Por favor, confirme seu e-mail antes de fazer login.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setIsSubmitting(true);
    
    try {
      await loginWithGoogle();
      toast({
        title: 'Redirecionando...',
        description: 'Você será redirecionado para fazer login com Google.',
      });
    } catch (error: any) {
      console.error('Erro no login com Google:', error);
      setError('Ocorreu um erro ao tentar fazer login com Google. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
    setShowForgotPassword(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    try {
      await resetPassword(resetEmail);
      toast({
        title: 'E-mail enviado!',
        description: 'Verifique sua caixa de entrada para redefinir sua senha.',
      });
      setShowForgotPassword(false);
      setResetEmail('');
    } catch (error: any) {
      console.error('Erro ao enviar e-mail:', error);
      setError('Erro ao enviar e-mail de redefinição. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showForgotPassword) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Esqueci minha senha
          </CardTitle>
          <CardDescription className="text-center">
            Digite seu e-mail para receber um link de redefinição de senha.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleForgotPassword}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="reset-email">E-mail</Label>
              <Input
                id="reset-email"
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="seu@email.com"
                required
              />
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4">
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Enviando...' : 'Enviar link de redefinição'}
            </Button>
            
            <Button 
              variant="link" 
              className="w-full" 
              onClick={() => {
                setShowForgotPassword(false);
                setError('');
              }} 
              type="button"
              disabled={isSubmitting}
            >
              Voltar para o login
            </Button>
          </CardFooter>
        </form>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">
          {mode === 'login' ? 'Entrar no Compuse' : 'Criar sua conta'}
        </CardTitle>
        <CardDescription className="text-center">
          {mode === 'login' 
            ? 'Entre com seu e-mail e senha para acessar suas composições.' 
            : 'Preencha os campos abaixo para criar sua conta.'}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {mode === 'register' && (
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome completo"
                required
              />
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Senha</Label>
              {mode === 'login' && (
                <Button
                  variant="link"
                  type="button"
                  className="px-0 h-auto text-xs"
                  onClick={() => setShowForgotPassword(true)}
                >
                  Esqueci minha senha
                </Button>
              )}
            </div>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
              required
              minLength={6}
            />
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-4">
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting}
          >
            {isSubmitting 
              ? 'Processando...' 
              : mode === 'login' ? 'Entrar' : 'Criar conta'}
          </Button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                ou
              </span>
            </div>
          </div>
          
          <Button 
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogleLogin}
            disabled={isSubmitting}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continuar com Google
          </Button>
          
          <p className="text-sm text-center text-muted-foreground">
            {mode === 'login' ? 'Não tem uma conta?' : 'Já tem uma conta?'}
            <Button 
              variant="link" 
              className="px-2 py-0 h-auto" 
              onClick={toggleMode} 
              type="button"
              disabled={isSubmitting}
            >
              {mode === 'login' ? 'Registre-se' : 'Faça login'}
            </Button>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
};
