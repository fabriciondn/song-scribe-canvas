import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, DollarSign, Sparkles, ArrowLeft, ArrowRight } from 'lucide-react';
import { MobileBottomNavigation } from '@/components/mobile/MobileBottomNavigation';
import { useMobileDetection } from '@/hooks/use-mobile';
import guitarImage from '@/assets/guitar-sorteio.jpg';

const SorteioComoFunciona: React.FC = () => {
  const navigate = useNavigate();
  const { isMobile } = useMobileDetection();

  const handleBecomePro = () => {
    navigate('/dashboard/subscription-checkout');
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-black text-white font-['Outfit',sans-serif]">
      <div className="relative flex h-full min-h-screen w-full flex-col overflow-x-hidden pb-24">
        {/* Top App Bar */}
        <div className="sticky top-0 z-50 flex items-center bg-black/80 backdrop-blur-md px-4 py-3 justify-between">
          <button 
            onClick={handleBack}
            className="flex size-10 items-center justify-center rounded-full hover:bg-white/10 transition-colors group"
          >
            <ArrowLeft className="text-white group-hover:text-primary transition-colors w-6 h-6" />
          </button>
          <h2 className="text-white text-base font-semibold tracking-wide uppercase opacity-80">Como funciona</h2>
          <div className="size-10" />
        </div>

        {/* Header Image with Guitar Illustration */}
        <div className="w-full px-0">
          <div className="relative w-full h-[260px] flex flex-col justify-end overflow-hidden">
            {/* Background Image */}
            <div 
              className="absolute inset-0 bg-center bg-no-repeat bg-cover"
              style={{ backgroundImage: `url(${guitarImage})` }}
            />
            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/60 to-black" />
            {/* Floating Decorative Elements */}
            <div className="absolute top-10 right-10 size-12 rounded-full bg-primary blur-[40px] opacity-40 animate-pulse" />
            <div className="absolute bottom-20 left-4 size-20 rounded-full bg-primary blur-[60px] opacity-20" />
          </div>
        </div>

        {/* Headline Text */}
        <div className="px-6 pt-2 pb-6 text-center relative z-10">
          <h1 className="text-white tracking-tight text-[32px] font-bold leading-[1.1] mb-3">
            Como ganhar mais<br /> <span className="text-primary">números?</span>
          </h1>
          <p className="text-white/60 text-base font-normal leading-relaxed max-w-xs mx-auto">
            Aumente suas chances no sorteio seguindo estes passos simples.
          </p>
        </div>

        {/* Timeline / Steps */}
        <div className="px-6 mt-4">
          <div className="grid grid-cols-[48px_1fr] gap-x-4">
            {/* Step 1: Connector */}
            <div className="flex flex-col items-center pt-2">
              <div className="flex items-center justify-center size-10 rounded-full bg-[#111111] border border-primary/30 shadow-[0_0_15px_rgba(6,249,47,0.1)] z-10">
                <Lock className="text-primary w-5 h-5" />
              </div>
              <div className="w-[2px] bg-gradient-to-b from-primary/50 to-primary/10 h-full min-h-[60px] rounded-full my-2" />
            </div>
            {/* Step 1: Content */}
            <div className="flex flex-col py-2 pb-8">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-white text-lg font-bold">Torne-se PRO</h3>
                <span className="px-2 py-0.5 bg-primary/20 rounded text-[10px] font-bold text-primary tracking-wider uppercase">Obrigatório</span>
              </div>
              <p className="text-gray-400 text-sm font-medium leading-relaxed">
                O acesso exclusivo aos sorteios começa aqui. Assine e desbloqueie vantagens.
              </p>
            </div>

            {/* Step 2: Connector */}
            <div className="flex flex-col items-center">
              <div className="flex items-center justify-center size-10 rounded-full bg-[#111111] border border-white/10 z-10">
                <DollarSign className="text-white w-5 h-5" />
              </div>
            </div>
            {/* Step 2: Content */}
            <div className="flex flex-col py-2">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-white text-lg font-bold">Compre Créditos</h3>
              </div>
              <p className="text-gray-400 text-sm font-medium leading-relaxed">
                Use seus créditos adquiridos para gerar números da sorte automaticamente.
              </p>
            </div>
          </div>
        </div>

        {/* Info Box: Math of Luck */}
        <div className="px-6 mt-10 mb-6">
          <div className="relative overflow-hidden rounded-2xl bg-[#111111] border border-white/5 p-5">
            {/* Background decoration */}
            <div className="absolute -right-6 -top-6 size-24 bg-primary/10 rounded-full blur-xl" />
            <div className="relative flex items-start gap-4">
              <div className="shrink-0 pt-1">
                <Sparkles className="text-primary w-7 h-7" />
              </div>
              <div>
                <h4 className="text-white text-base font-bold mb-1">Matemática da Sorte</h4>
                <p className="text-sm text-gray-400 leading-relaxed">
                  A cada crédito que você adquire, você ganha exatamente <span className="text-primary font-bold">+1 número da sorte</span> extra.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Spacer for scroll */}
        <div className="h-6" />

        {/* Fixed Bottom CTA */}
        <div className="fixed bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black via-black to-transparent z-40">
          <button 
            onClick={handleBecomePro}
            className="w-full h-14 bg-primary hover:bg-primary/90 active:scale-[0.98] transition-all rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(6,249,47,0.3)] group"
          >
            <span className="text-black text-lg font-bold mr-2">Ser PRO agora</span>
            <ArrowRight className="text-black group-hover:translate-x-1 transition-transform w-5 h-5" />
          </button>
        </div>
      </div>

      {isMobile && <MobileBottomNavigation />}
    </div>
  );
};

export default SorteioComoFunciona;
