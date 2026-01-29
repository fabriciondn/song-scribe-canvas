import React, { useState, useEffect, useTransition } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { AuthForm } from '../components/auth/AuthForm';
import { Button } from '@/components/ui/button';
import { HeroSection } from '@/components/landing/HeroSection';
import { BenefitsSection } from '@/components/landing/BenefitsSection';
import { ProcessSection } from '@/components/landing/ProcessSection';
import { ComparisonSection } from '@/components/landing/ComparisonSection';
import { LegalProofSection } from '@/components/landing/LegalProofSection';
import { FinalCTASection } from '@/components/landing/FinalCTASection';

// Detectar se é iOS PWA (standalone mode)
const isIOSPWA = () => {
  if (typeof window === 'undefined') return false;
  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
  const isStandalone = (window.navigator as any).standalone === true;
  return isIOS && isStandalone;
};

const Index: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [isPending, startTransition] = useTransition();
  
  // Verificar se veio de link de afiliado ou ação de registro
  const urlParams = new URLSearchParams(window.location.search);
  const hasAffiliateRef = urlParams.has('ref');
  const hasRegisterAction = urlParams.get('action') === 'register';
  
  const [showAuth, setShowAuth] = useState(hasAffiliateRef || hasRegisterAction);
  const [defaultAuthMode] = useState<'login' | 'register'>(
    hasRegisterAction || hasAffiliateRef ? 'register' : 'login'
  );
  const [isIOSPwaMode] = useState(isIOSPWA);

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Force dark theme for landing page
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('dark');
    
    return () => {
      // Cleanup handled by useTheme hook elsewhere
    };
  }, []);

  // Ensure scroll works on landing page (safety net for desktop)
  useEffect(() => {
    document.documentElement.style.overflowY = 'auto';
    document.body.style.overflowY = 'auto';
    
    return () => {
      document.documentElement.style.overflowY = '';
      document.body.style.overflowY = '';
    };
  }, []);

  // Usar startTransition para suavizar a troca de tela no iOS
  const handleGetStarted = () => {
    startTransition(() => {
      setShowAuth(true);
    });
  };

  const handleLearnMore = () => {
    document.getElementById('benefits')?.scrollIntoView({
      behavior: 'smooth'
    });
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
    <div className="min-h-screen bg-black text-white">
      {/* Fixed Header - sem backdrop-blur no iOS PWA para evitar travamento */}
      <header className={`fixed top-0 w-full z-50 border-b border-gray-800/50 ${isIOSPwaMode ? 'bg-black/95' : 'backdrop-blur-xl bg-black/80'}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img 
              src="/lovable-uploads/01194843-44b5-470b-9611-9f7d44e46212.png"
              alt="Compuse Logo" 
              className="h-8"
            />
          </div>

          <Button 
            onClick={handleGetStarted} 
            className="bg-gradient-to-r from-primary to-green-400 hover:from-green-400 hover:to-primary text-black font-semibold transition-all duration-300 hover:scale-105"
          >
            Começar agora
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {/* Hero Section */}
        <HeroSection 
          onGetStarted={handleGetStarted}
          onLearnMore={handleLearnMore}
        />

        {/* Benefits Section */}
        <div id="benefits">
          <BenefitsSection />
        </div>

        {/* Process Section */}
        <ProcessSection />

        {/* Comparison Section */}
        <ComparisonSection />

        {/* Legal Proof Section */}
        <LegalProofSection />

        {/* Final CTA Section */}
        <FinalCTASection onGetStarted={handleGetStarted} />
      </main>

      {/* Footer */}
      <footer className="py-12 px-6 bg-gradient-to-b from-black to-gray-950 border-t border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <img 
                src="/lovable-uploads/01194843-44b5-470b-9611-9f7d44e46212.png"
                alt="Compuse Logo" 
                className="h-6"
              />
              <span className="text-gray-500">© {new Date().getFullYear()}</span>
            </div>
            
            <div className="text-center text-gray-400">
              <p>Protegendo compositores com tecnologia e respaldo jurídico</p>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>Todos os direitos reservados</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;