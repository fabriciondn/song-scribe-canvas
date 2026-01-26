import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

type AuthMode = 'login' | 'register';

interface AuthFormProps {
  defaultMode?: AuthMode;
}

export const AuthForm: React.FC<AuthFormProps> = ({ defaultMode = 'login' }) => {
  const [mode, setMode] = useState<AuthMode>(defaultMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
        
        // Processar afiliação após signup bem-sucedido
        const affiliateCode = localStorage.getItem('affiliate_code');
        if (affiliateCode) {
          try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            const { data: { user: newUser } } = await supabase.auth.getUser();
            
            if (newUser) {
              const { data: affiliate } = await supabase
                .from('affiliates')
                .select('id')
                .eq('affiliate_code', affiliateCode)
                .eq('status', 'approved')
                .single();
              
              if (affiliate) {
                const { data: lastClick } = await supabase
                  .from('affiliate_clicks')
                  .select('id')
                  .eq('affiliate_id', affiliate.id)
                  .is('user_id', null)
                  .order('created_at', { ascending: false })
                  .limit(1)
                  .single();
                
                if (lastClick) {
                  await supabase
                    .from('affiliate_clicks')
                    .update({ user_id: newUser.id, converted: true })
                    .eq('id', lastClick.id);
                  
                  await supabase
                    .from('affiliate_conversions')
                    .insert({
                      affiliate_id: affiliate.id,
                      user_id: newUser.id,
                      click_id: lastClick.id,
                      type: 'author_registration',
                      reference_id: newUser.id
                    });
                }
              }
              localStorage.removeItem('affiliate_code');
            }
          } catch (error) {
            console.error('Erro ao vincular afiliado:', error);
          }
        }
        
        toast({
          title: 'Conta criada com sucesso!',
          description: 'Bem-vindo ao Compuse.',
        });
      }
    } catch (error: any) {
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
        description: 'Enviamos um link de confirmação para seu e-mail para redefinir sua senha.',
        duration: 5000,
      });
      setShowForgotPassword(false);
      setResetEmail('');
      setMode('login');
    } catch (error: any) {
      setError('Erro ao enviar e-mail de redefinição. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Forgot Password View
  if (showForgotPassword) {
    return (
      <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center p-4 relative overflow-hidden font-['Outfit',sans-serif]">
        {/* Glow Effects */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute w-96 h-96 -top-20 -right-20 bg-[#00C853] rounded-full blur-[90px] opacity-[0.12]" />
          <div className="absolute w-80 h-80 -bottom-20 -left-20 bg-[#00C853] rounded-full blur-[90px] opacity-[0.12]" />
        </div>

        <div className="w-full max-w-md relative z-10">
          {/* Logo */}
          <div className="text-center mb-10">
            <h1 className="text-5xl font-bold tracking-tight text-white mb-3">Compuse</h1>
            <p className="text-[#9CA3AF] text-lg font-light">Proteja sua música, crie seu legado.</p>
          </div>

          {/* Card */}
          <div className="bg-[#1E1E1E] rounded-2xl p-6 md:p-8 shadow-2xl border border-[#333333]">
            <h2 className="text-2xl font-bold mb-2 text-white">Esqueci minha senha</h2>
            <p className="text-[#9CA3AF] text-sm mb-6">Digite seu e-mail para receber um link de redefinição.</p>

            {error && (
              <Alert variant="destructive" className="mb-4 bg-red-500/10 border-red-500/20">
                <AlertDescription className="text-red-400">{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleForgotPassword} className="space-y-5">
              <div>
                <Label className="block text-sm font-medium text-[#9CA3AF] mb-1 ml-1">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#6B7280]" />
                  <Input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="seu@email.com"
                    required
                    className="w-full h-14 pl-12 bg-[#2A2A2A] border-[#333333] rounded-xl text-white placeholder:text-[#6B7280] focus:border-[#00C853] focus:ring-[#00C853]"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-14 bg-[#00C853] hover:bg-[#009624] text-white font-semibold text-lg rounded-xl transition-all"
              >
                {isSubmitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>Enviar link</>
                )}
              </Button>

              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(false);
                  setError('');
                }}
                className="w-full text-center text-[#00C853] hover:underline text-sm font-medium"
              >
                Voltar para o login
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center p-4 relative overflow-hidden font-['Outfit',sans-serif]">
      {/* Glow Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute w-96 h-96 -top-20 -right-20 bg-[#00C853] rounded-full blur-[90px] opacity-[0.12]" />
        <div className="absolute w-80 h-80 -bottom-20 -left-20 bg-[#00C853] rounded-full blur-[90px] opacity-[0.12]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-10 pt-4">
          <h1 className="text-5xl font-bold tracking-tight text-white mb-3">Compuse</h1>
          <p className="text-[#9CA3AF] text-lg font-light">Proteja sua música, crie seu legado.</p>
        </div>

        {/* Card */}
        <div className="bg-[#1E1E1E] rounded-2xl p-6 md:p-8 shadow-2xl border border-[#333333]">
          <h2 className="text-2xl font-bold mb-6 text-white">
            {mode === 'login' ? 'Bem-vindo de volta!' : 'Criar sua conta'}
          </h2>

          {error && (
            <Alert variant="destructive" className="mb-4 bg-red-500/10 border-red-500/20">
              <AlertDescription className="text-red-400">{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'register' && (
              <div>
                <Label className="block text-sm font-medium text-[#9CA3AF] mb-1 ml-1">Nome</Label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#6B7280]" />
                  <Input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome completo"
                    required
                    className="w-full h-14 pl-12 bg-[#2A2A2A] border-[#333333] rounded-xl text-white placeholder:text-[#6B7280] focus:border-[#00C853] focus:ring-[#00C853]"
                  />
                </div>
              </div>
            )}

            <div>
              <Label className="block text-sm font-medium text-[#9CA3AF] mb-1 ml-1">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#6B7280]" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="w-full h-14 pl-12 bg-[#2A2A2A] border-[#333333] rounded-xl text-white placeholder:text-[#6B7280] focus:border-[#00C853] focus:ring-[#00C853]"
                />
              </div>
            </div>

            <div>
              <Label className="block text-sm font-medium text-[#9CA3AF] mb-1 ml-1">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#6B7280]" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full h-14 pl-12 pr-12 bg-[#2A2A2A] border-[#333333] rounded-xl text-white placeholder:text-[#6B7280] focus:border-[#00C853] focus:ring-[#00C853]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              
              {mode === 'login' && (
                <div className="text-right mt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-[#00C853] hover:underline text-sm font-medium"
                  >
                    Esqueci minha senha
                  </button>
                </div>
              )}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-14 bg-[#00C853] hover:bg-[#009624] text-white font-semibold text-lg rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  {mode === 'login' ? 'Entrar' : 'Criar conta'}
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </Button>

            {/* Divider */}
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#333333]" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-[#1E1E1E] px-4 text-[#6B7280]">Ou continue com</span>
              </div>
            </div>

            {/* Google Button */}
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleLogin}
              disabled={isSubmitting}
              className="w-full h-14 bg-[#2A2A2A] hover:bg-[#333333] border-[#333333] text-white font-medium rounded-xl transition-all flex items-center justify-center gap-3"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </Button>
          </form>
        </div>

        {/* Footer Link */}
        <p className="text-center mt-6 text-[#9CA3AF]">
          {mode === 'login' ? 'Não tem uma conta?' : 'Já tem uma conta?'}
          <button
            type="button"
            onClick={toggleMode}
            disabled={isSubmitting}
            className="ml-2 text-[#00C853] hover:underline font-semibold"
          >
            {mode === 'login' ? 'Criar conta' : 'Fazer login'}
          </button>
        </p>
      </div>
    </div>
  );
};
