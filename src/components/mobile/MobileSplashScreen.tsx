import React, { useEffect, useState } from 'react';
import { useMobileDetection } from '@/hooks/use-mobile';

interface MobileSplashScreenProps {
  onComplete: () => void;
  duration?: number;
}

export const MobileSplashScreen: React.FC<MobileSplashScreenProps> = ({ 
  onComplete, 
  duration = 2500 
}) => {
  const { isMobile } = useMobileDetection();
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Só mostrar splash em mobile
    if (!isMobile) {
      onComplete();
      return;
    }

    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 300); // Aguarda a animação de fade out
    }, duration);

    return () => clearTimeout(timer);
  }, [isMobile, duration, onComplete]);

  // Não renderiza em desktop
  if (!isMobile) return null;

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-between bg-[#0A0A0A] transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      style={{ minHeight: '100dvh' }}
    >
      {/* Efeitos de blur no fundo */}
      <div 
        className="absolute top-[-10%] right-[-10%] w-[80vw] h-[80vw] bg-primary/10 rounded-full blur-[120px] pointer-events-none"
        style={{ 
          animation: 'pulse-subtle 4s infinite ease-in-out' 
        }}
      />
      <div className="absolute bottom-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      
      {/* Logo centralizada */}
      <div className="flex-1 flex flex-col items-center justify-center w-full px-8 relative z-10">
        <div className="flex flex-col items-center mb-6">
          <div className="relative w-64 h-auto">
            <img 
              alt="Compuse Logo" 
              className="w-full h-auto object-contain"
              src="/lovable-uploads/b2e99156-0e7f-46c8-8b49-eafea58416f9.png"
            />
          </div>
        </div>
      </div>
      
      {/* Texto e loader na parte inferior */}
      <div className="w-full flex flex-col items-center justify-end pb-16 px-6 relative z-10">
        <div 
          className="text-center mb-16"
          style={{ 
            animation: 'slide-up 0.8s ease-out 0.2s forwards',
            opacity: 0 
          }}
        >
          <h2 className="text-white text-xl font-semibold tracking-wide">
            Proteja sua música.
          </h2>
          <p className="text-gray-400 text-sm mt-2 font-medium">
            Crie com confiança.
          </p>
        </div>
        
        {/* Spinner de loading */}
        <div className="relative w-6 h-6">
          <div className="absolute w-full h-full border-2 border-white/10 rounded-full" />
          <div 
            className="absolute w-full h-full border-2 border-transparent border-t-primary rounded-full"
            style={{ animation: 'spin 1s linear infinite' }}
          />
        </div>
      </div>

      {/* Keyframes CSS */}
      <style>{`
        @keyframes pulse-subtle {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.05); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};
