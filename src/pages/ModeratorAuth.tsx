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

import { useAuth } from '@/hooks/useAuth';

const ModeratorAuth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  
  // Only login mode is supported now
  const [mode] = useState<'login'>('login');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });



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
          <CardTitle className="text-2xl">Acesso de Moderador</CardTitle>
          <CardDescription>Entre com suas credenciais de moderador</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-6" variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
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
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
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