import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { AuthForm } from '../components/auth/AuthForm';
import { Button } from '@/components/ui/button';
const Index: React.FC = () => {
  const {
    isAuthenticated,
    isLoading
  } = useAuth();
  const navigate = useNavigate();
  const [showAuth, setShowAuth] = useState(false);
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, isLoading, navigate]);
  return <div className="min-h-screen flex flex-col">
      <header className="w-full py-4 px-6 flex items-center justify-between bg-background border-b">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">Compuse</h1>
        </div>

        <Button onClick={() => setShowAuth(true)} variant="default">
          Entrar
        </Button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6">
        {showAuth ? <div className="w-full max-w-md animate-fade-in">
            <AuthForm />
          </div> : <div className="max-w-3xl text-center space-y-8 animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                Organize suas composições
              </span>{' '}
              com elegância e facilidade
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">Compuse é a plataforma para compositores organizarem suas letras, gerarem documentos de anterioridade e colaborarem em tempo real.</p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={() => setShowAuth(true)} size="lg" className="text-lg px-8">
                Começar agora
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8" onClick={() => {
            document.getElementById('features')?.scrollIntoView({
              behavior: 'smooth'
            });
          }}>
                Saiba mais
              </Button>
            </div>
          </div>}
      </main>

      <section id="features" className="py-20 px-6 bg-secondary/50">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8">
          <div className="bg-card p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-2">Editor Intuitivo</h3>
            <p className="text-muted-foreground">
              Editor de texto especializado para letras de música com seções pré-definidas.
            </p>
          </div>
          
          <div className="bg-card p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-2">Documentos de Anterioridade</h3>
            <p className="text-muted-foreground">
              Gere DAs profissionais com suas informações automaticamente.
            </p>
          </div>
          
          <div className="bg-card p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-2">Colaboração em Tempo Real</h3>
            <p className="text-muted-foreground">
              Trabalhe em parceria com outros compositores de forma simples.
            </p>
          </div>
        </div>
      </section>

      <footer className="py-8 px-6 bg-card border-t">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} SongScribe Canvas. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>;
};
export default Index;