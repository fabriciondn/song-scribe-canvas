import React, { useState, useEffect, useTransition } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { AuthForm } from '../components/auth/AuthForm';
import { Button } from '@/components/ui/button';
import { CompuseHeader } from '@/components/landing/compuse/CompuseHeader';
import { PremiumHero } from '@/components/landing/compuse/PremiumHero';
import { ServiceCards } from '@/components/landing/compuse/ServiceCards';
import { HowItWorks } from '@/components/landing/compuse/HowItWorks';
import { Pricing } from '@/components/landing/compuse/Pricing';
import { FAQ } from '@/components/landing/compuse/FAQ';
import { FinalCTA } from '@/components/landing/compuse/FinalCTA';

import { AnimatedText } from '@/components/landing/compuse/AnimatedText';
import { PainPoints } from '@/components/landing/compuse/PainPoints';
import { Solution } from '@/components/landing/compuse/Solution';
import { Objections } from '@/components/landing/compuse/Objections';
import { GuaranteeUrgency } from '@/components/landing/compuse/GuaranteeUrgency';
import { Testimonials } from '@/components/landing/compuse/Testimonials';
import { VideoPlayer } from '@/components/landing/compuse/VideoPlayer';

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
    if (showAuth) {
      document.documentElement.style.overflowY = 'hidden';
      document.body.style.overflowY = 'hidden';
      document.documentElement.style.background = '#000';
      document.body.style.background = '#000';
    } else {
      document.documentElement.style.overflowY = 'auto';
      document.body.style.overflowY = 'auto';
      document.documentElement.style.background = '';
      document.body.style.background = '';
    }
    return () => {
      document.documentElement.style.overflowY = '';
      document.body.style.overflowY = '';
      document.documentElement.style.background = '';
      document.body.style.background = '';
    };
  }, [showAuth]);

  const handleGetStarted = () => {
    startTransition(() => setShowAuth(true));
  };

  const handleLearnMore = () => {
    document.getElementById('como-funciona')?.scrollIntoView({ behavior: 'smooth' });
  };

  if (showAuth) {
    return (
      <div className="h-screen w-screen bg-black overflow-hidden">
        <AuthForm defaultMode={defaultAuthMode} onBack={() => setShowAuth(false)} />
      </div>
    );
  }

  return (
    <div className="compuse-scope min-h-screen">
      <CompuseHeader onCTA={handleGetStarted} />

      <main>
        <PremiumHero onPrimary={handleGetStarted} onSecondary={handleLearnMore} />
        <Testimonials />
        
        <PainPoints />
        <Solution />

        <section className="py-16 md:py-20" style={{ background: 'var(--c-bg-deep)' }}>
          <div className="c-container max-w-5xl">
            <VideoPlayer
              videoId="tKQ7kZjvjqI"
              videoUrl="https://www.youtube.com/embed/tKQ7kZjvjqI"
              title="Como funciona o registro Compuse"
              description="Tour completo pela plataforma: do upload da obra ao certificado com hash criptográfico."
            />
          </div>
        </section>

        <ServiceCards onCTA={handleGetStarted} />
        <HowItWorks />
        <Pricing onCTA={handleGetStarted} />
        <Objections />
        <GuaranteeUrgency />
        <FAQ />
        <FinalCTA onCTA={handleGetStarted} />
      </main>

      <section className="py-8 md:py-16" style={{ background: '#000' }}>
        <AnimatedText text="Compuse" />
      </section>

      <footer className="py-12" style={{ background: 'var(--c-bg-deep)', borderTop: '1px solid var(--c-border)' }}>
        <div className="c-container flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <img
              src="/__l5e/assets-v1/3e3bdce3-f19c-4b1d-afe0-4fcac32b4eb2/logo-compuse.png"
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
