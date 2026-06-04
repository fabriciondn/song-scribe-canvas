import React, { useState, useEffect, useTransition } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { AuthForm } from '../components/auth/AuthForm';
import { Button } from '@/components/ui/button';
import { CompuseHeader } from '@/components/landing/compuse/CompuseHeader';
import { OrbitSystem } from '@/components/landing/compuse/OrbitSystem';
import { ServiceCards } from '@/components/landing/compuse/ServiceCards';
import { HowItWorks } from '@/components/landing/compuse/HowItWorks';
import { Pricing } from '@/components/landing/compuse/Pricing';
import { FAQ } from '@/components/landing/compuse/FAQ';
import { FinalCTA } from '@/components/landing/compuse/FinalCTA';

const Index: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [, startTransition] = useTransition();

  const urlParams = new URLSearchParams(window.location.search);
  const hasAffiliateRef = urlParams.has('ref');
  const hasRegisterAction = urlParams.get('action') === 'register';

  const [showAuth, setShowAuth] = useState(hasAffiliateRef || hasRegisterAction);
  const [defaultAuthMode] = useState<'login' | 'register'>(
    hasRegisterAction || hasAffiliateRef ? 'register' : 'login'
  );

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, isLoading, navigate]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('dark');
  }, []);

  useEffect(() => {
    document.documentElement.style.overflowY = 'auto';
    document.body.style.overflowY = 'auto';
    return () => {
      document.documentElement.style.overflowY = '';
      document.body.style.overflowY = '';
    };
  }, []);

  const handleGetStarted = () => {
    startTransition(() => setShowAuth(true));
  };

  const handleLearnMore = () => {
    document.getElementById('como-funciona')?.scrollIntoView({ behavior: 'smooth' });
  };

  if (showAuth) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8 space-y-4">
            <img
              src="/lovable-uploads/01194843-44b5-470b-9611-9f7d44e46212.png"
              alt="Compuse Logo"
              className="h-8 mx-auto"
            />
            <Button
              variant="ghost"
              onClick={() => setShowAuth(false)}
              className="text-gray-400 hover:text-white"
            >
              ← Voltar para o site
            </Button>
          </div>
          <AuthForm defaultMode={defaultAuthMode} />
        </div>
      </div>
    );
  }

  return (
    <div className="compuse-scope min-h-screen">
      <CompuseHeader onCTA={handleGetStarted} />

      <main>
        <OrbitSystem onPrimary={handleGetStarted} onSecondary={handleLearnMore} />
        <ServiceCards onCTA={handleGetStarted} />
        <HowItWorks />
        <Pricing onCTA={handleGetStarted} />
        <FAQ />
        <FinalCTA onCTA={handleGetStarted} />
      </main>

      <footer className="py-12" style={{ background: 'var(--c-bg-deep)', borderTop: '1px solid var(--c-border)' }}>
        <div className="c-container flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <img
              src="/lovable-uploads/01194843-44b5-470b-9611-9f7d44e46212.png"
              alt="Compuse Logo"
              className="h-6"
            />
            <span style={{ color: 'var(--c-text-soft)' }}>© {new Date().getFullYear()}</span>
          </div>
          <p className="text-center text-sm" style={{ color: 'var(--c-text-muted)' }}>
            Protegendo compositores com tecnologia e respaldo jurídico
          </p>
          <span className="text-sm" style={{ color: 'var(--c-text-soft)' }}>
            Todos os direitos reservados
          </span>
        </div>
      </footer>
    </div>
  );
};

export default Index;
