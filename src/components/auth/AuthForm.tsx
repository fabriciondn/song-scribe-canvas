import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

type AuthMode = 'login' | 'register';

interface AuthFormProps {
  defaultMode?: AuthMode;
}

const validateEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

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
  const [avatars, setAvatars] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.rpc('get_landing_composer_avatars', { limit_count: 12 });
        if (data) {
          const urls = (data as any[])
            .map((c) => c.avatar_url)
            .filter((u: string) => u && /^https?:\/\//.test(u))
            .slice(0, 4);
          setAvatars(urls);
        }
      } catch (e) {
        console.warn('avatars load failed', e);
      }
    })();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Por favor, preencha e-mail e senha.');
      return;
    }
    if (!validateEmail(email)) {
      setError('Por favor, insira um e-mail válido.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        if (!name) throw new Error('Nome é obrigatório');
        await register(name, email, password);

        const affiliateCode = localStorage.getItem('affiliate_code');
        if (affiliateCode) {
          try {
            await new Promise((r) => setTimeout(r, 1000));
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
                  await supabase.from('affiliate_conversions').insert({
                    affiliate_id: affiliate.id,
                    user_id: newUser.id,
                    click_id: lastClick.id,
                    type: 'author_registration',
                    reference_id: newUser.id,
                  });
                }
              }
              localStorage.removeItem('affiliate_code');
            }
          } catch (err) {
            console.error('Erro ao vincular afiliado:', err);
          }
        }

        toast({
          title: 'Conta criada com sucesso!',
          description: 'Bem-vindo ao Compuse.',
        });
      }
    } catch (err: any) {
      let msg = 'Ocorreu um erro ao processar sua solicitação';
      if (err.message) {
        if (err.message.includes('Email already in use')) {
          msg = 'Este e-mail já está em uso. Tente outro ou faça login.';
        } else if (err.message.includes('Invalid login credentials')) {
          msg = 'E-mail ou senha incorretos.';
        } else if (err.message.includes('Email not confirmed')) {
          msg = 'Por favor, confirme seu e-mail antes de fazer login.';
        } else {
          msg = err.message;
        }
      }
      setError(msg);
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
        description: 'Você será redirecionado para login com Google.',
      });
    } catch {
      setError('Erro ao fazer login com Google. Tente novamente.');
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
        description: 'Enviamos um link para redefinir sua senha.',
        duration: 5000,
      });
      setShowForgotPassword(false);
      setResetEmail('');
      setMode('login');
    } catch {
      setError('Erro ao enviar e-mail de redefinição. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Shared shell wrapper
  const Shell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#121212] relative overflow-hidden font-['Outfit',sans-serif] p-4">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -right-32 w-[480px] h-[480px] bg-[#00C853] rounded-full blur-[120px] opacity-[0.18]" />
        <div className="absolute -bottom-32 -left-32 w-[420px] h-[420px] bg-[#00C853] rounded-full blur-[120px] opacity-[0.14]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#121212_70%)]" />
      </div>

      {/* Glass card */}
      <div className="relative z-10 w-full max-w-md">
        <div className="relative rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)] p-8 md:p-10">
          {/* Logo */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#00C853] to-[#009624] flex items-center justify-center shadow-lg shadow-[#00C853]/30 mb-4">
              <span className="text-white text-2xl font-bold">C</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Compuse</h1>
            <p className="text-[#9CA3AF] text-sm mt-1 font-light">
              Proteja sua música, crie seu legado.
            </p>
          </div>
          {children}
        </div>

        {/* Footer trust */}
        <div className="mt-8 flex flex-col items-center gap-3">
          <div className="flex -space-x-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full border-2 border-[#121212] bg-gradient-to-br from-[#00C853]/60 to-[#009624]/60"
              />
            ))}
          </div>
          <p className="text-xs text-[#9CA3AF] text-center max-w-xs">
            Junte-se a milhares de compositores que já protegem suas obras com a Compuse.
          </p>
        </div>
      </div>
    </div>
  );

  // Input style
  const inputClass =
    'w-full h-12 px-4 bg-white/[0.04] border border-white/10 rounded-xl text-white placeholder:text-[#6B7280] focus:outline-none focus:border-[#00C853] focus:ring-2 focus:ring-[#00C853]/30 transition-all';

  // ----- Forgot password view -----
  if (showForgotPassword) {
    return (
      <Shell>
        <h2 className="text-xl font-semibold text-white mb-1">Esqueci minha senha</h2>
        <p className="text-[#9CA3AF] text-sm mb-6">
          Digite seu e-mail para receber um link.
        </p>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleForgotPassword} className="space-y-4">
          <input
            type="email"
            placeholder="seu@email.com"
            value={resetEmail}
            onChange={(e) => setResetEmail(e.target.value)}
            required
            className={inputClass}
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 bg-[#00C853] hover:bg-[#009624] text-white font-semibold rounded-xl transition-all flex items-center justify-center disabled:opacity-60"
          >
            {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Enviar link'}
          </button>

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
      </Shell>
    );
  }

  // ----- Login / Register -----
  return (
    <Shell>
      <h2 className="text-xl font-semibold text-white mb-6 text-center">
        {mode === 'login' ? 'Bem-vindo de volta' : 'Crie sua conta'}
      </h2>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'register' && (
          <input
            type="text"
            placeholder="Seu nome completo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className={inputClass}
          />
        )}

        <input
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className={inputClass}
        />

        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className={`${inputClass} pr-12`}
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
          <div className="text-right">
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="text-[#00C853] hover:underline text-sm font-medium"
            >
              Esqueci minha senha
            </button>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-12 bg-[#00C853] hover:bg-[#009624] text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#00C853]/20 disabled:opacity-60"
        >
          {isSubmitting ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              {mode === 'login' ? 'Entrar' : 'Criar conta'}
              <ArrowRight className="h-5 w-5" />
            </>
          )}
        </button>

        {/* Divider */}
        <div className="relative py-1">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-transparent px-3 text-[#6B7280] uppercase tracking-wider">
              ou
            </span>
          </div>
        </div>

        {/* Google */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isSubmitting}
          className="w-full h-12 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-3 disabled:opacity-60"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continuar com Google
        </button>

        <p className="text-center text-sm text-[#9CA3AF] pt-2">
          {mode === 'login' ? 'Não tem uma conta?' : 'Já tem uma conta?'}{' '}
          <button
            type="button"
            onClick={toggleMode}
            disabled={isSubmitting}
            className="text-[#00C853] hover:underline font-semibold"
          >
            {mode === 'login' ? 'Criar conta grátis' : 'Fazer login'}
          </button>
        </p>
      </form>
    </Shell>
  );
};
