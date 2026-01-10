import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '@/hooks/useSubscription';
import { useTheme } from '@/hooks/useTheme';
import { useMobileDetection } from '@/hooks/use-mobile';
import { useQuery } from '@tanstack/react-query';
import { raffleService } from '@/services/raffleService';
import { useRaffleVisibility } from '@/hooks/useRaffleVisibility';
import { toast } from 'sonner';
import { MobileBottomNavigation } from '@/components/mobile/MobileBottomNavigation';
import guitarImage from '@/assets/guitar-sorteio.jpg';

// Componente para Material Symbols
const MaterialIcon: React.FC<{ name: string; filled?: boolean; className?: string }> = ({ 
  name, 
  filled = false, 
  className = '' 
}) => (
  <span 
    className={`material-symbols-rounded ${className}`}
    style={{ 
      fontVariationSettings: filled ? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" : "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24"
    }}
  >
    {name}
  </span>
);

const Sorteio: React.FC = () => {
  const navigate = useNavigate();
  const { subscription } = useSubscription();
  const { theme } = useTheme();
  const { isMobile } = useMobileDetection();
  const [isParticipating, setIsParticipating] = useState(false);
  const { isRaffleVisible, isLoading: loadingVisibility } = useRaffleVisibility();
  
  const isPro = subscription?.status === 'active' && subscription?.plan_type === 'pro';

  // Redirecionar se o sorteio estiver oculto
  useEffect(() => {
    if (!loadingVisibility && !isRaffleVisible) {
      navigate('/dashboard');
    }
  }, [isRaffleVisible, loadingVisibility, navigate]);
  
  // Buscar dados do sorteio ativo (dinâmico, definido no painel admin)
  const { data: raffleSettings } = useQuery({
    queryKey: ['active-raffle'],
    queryFn: raffleService.getActiveRaffle,
  });

  const { data: reservations = [] } = useQuery({
    queryKey: ['raffle-reservations', raffleSettings?.id],
    queryFn: () => raffleService.getReservations(raffleSettings!.id),
    enabled: !!raffleSettings?.id,
  });

  const totalSlots = raffleSettings?.total_numbers ?? 0;
  const reservedSlots = reservations.length;
  const progressPercent = totalSlots > 0 ? (reservedSlots / totalSlots) * 100 : 0;
  const remainingPercent = Math.max(0, 100 - Math.round(progressPercent));

  const handleParticipate = () => {
    if (!isPro) {
      toast.error('Este sorteio é exclusivo para membros PRO!');
      navigate('/dashboard/subscription-checkout');
      return;
    }
    
    // Navegar para a página de seleção de números
    navigate('/dashboard/sorteio/numeros');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Sorteio de Violão - Compuse',
        text: 'Participe do sorteio exclusivo de um violão novinho!',
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copiado!');
    }
  };

  // Versão Mobile
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col font-['Outfit',sans-serif]">
        {/* Header com overlay na imagem */}
        <div className="flex items-center p-4 justify-between absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/60 to-transparent">
          <button 
            onClick={() => navigate('/dashboard')}
            className="text-white flex size-10 shrink-0 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors"
          >
            <MaterialIcon name="arrow_back" className="text-[24px]" />
          </button>
          <h2 className="text-white text-sm font-bold uppercase tracking-wider opacity-90 drop-shadow-md">Sorteio Exclusivo</h2>
          <button 
            onClick={handleShare}
            className="text-white flex size-10 shrink-0 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors"
          >
            <MaterialIcon name="share" className="text-[24px]" />
          </button>
        </div>

        {/* Imagem do violão */}
        <div className="relative w-full h-[55vh] shrink-0">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${guitarImage})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
          <div className="absolute bottom-4 left-6">
            <div className="inline-flex items-center justify-center gap-x-1.5 rounded-full bg-primary/20 border border-primary/50 backdrop-blur-md px-4 py-1.5 shadow-lg shadow-primary/10">
              <MaterialIcon name="workspace_premium" className="text-primary text-[18px]" />
              <p className="text-primary text-xs font-bold tracking-wider uppercase">Benefício PRO</p>
            </div>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 flex flex-col px-6 pt-2 pb-8 relative z-10 -mt-6">
          <div className="mb-4">
            <h1 className="text-foreground tracking-tight text-[32px] font-bold leading-[1.15] mb-3">
              Transforme suas <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">composições</span> com um novo violão.
            </h1>
            <div className="flex items-start gap-3">
              <MaterialIcon name="local_shipping" className="text-primary mt-0.5" />
              <p className="text-muted-foreground text-base font-normal leading-relaxed">
                Frete <span className="text-primary font-bold">100% grátis</span> para todo o país. O envio é por nossa conta.
              </p>
            </div>
          </div>

          <div className="flex-1" />

          {/* Card de participação automática */}
          <div className="bg-card rounded-xl p-4 mb-5 border border-border flex gap-3 items-start">
            <div className="bg-primary/10 p-2 rounded-lg shrink-0">
              <MaterialIcon name="auto_awesome" className="text-primary" />
            </div>
            <div>
              <h3 className="text-foreground font-semibold text-sm mb-1">Participação Automática</h3>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Sua assinatura PRO ativa garante entrada automática neste e em todos os futuros sorteios da plataforma.
              </p>
            </div>
          </div>

          {/* Barra de progresso */}
          <div className="w-full mb-6">
            <div className="flex justify-between items-end mb-2">
              <p className="text-muted-foreground text-xs font-medium">
                <span className="text-foreground">{reservedSlots} de {totalSlots}</span> números já reservados
              </p>
              <p className="text-primary text-xs font-bold uppercase tracking-widest drop-shadow-[0_0_8px_rgba(0,200,83,0.5)]">
                Últimos {remainingPercent}%!
              </p>
            </div>
            <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden backdrop-blur-sm">
              <div 
                className="h-full bg-primary shadow-[0_0_12px_rgba(0,200,83,0.6)] rounded-full relative transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Botão de participar */}
          {isPro ? (
            <button 
              onClick={handleParticipate}
              disabled={isParticipating}
              className="group relative w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 active:scale-[0.98] transition-all duration-200 py-4 px-6 rounded-xl shadow-[0_0_20px_rgba(0,200,83,0.3)] hover:shadow-[0_0_30px_rgba(0,200,83,0.5)] disabled:opacity-70"
            >
              {isParticipating ? (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary-foreground" />
              ) : (
                <>
                  <span className="text-primary-foreground font-bold text-lg tracking-wide group-hover:tracking-wider transition-all">
                    QUERO PARTICIPAR
                  </span>
                  <MaterialIcon name="arrow_forward" className="text-primary-foreground group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          ) : (
            <button 
              onClick={() => navigate('/dashboard/subscription-checkout')}
              className="group relative w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 active:scale-[0.98] transition-all duration-200 py-4 px-6 rounded-xl shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_30px_rgba(249,115,22,0.5)]"
            >
              <MaterialIcon name="lock" className="text-white" />
              <span className="text-white font-bold text-lg tracking-wide">
                ASSINE PRO PARA PARTICIPAR
              </span>
            </button>
          )}

          <p className="text-center text-muted-foreground text-[10px] mt-4 uppercase tracking-widest">
            Sorteio auditado e certificado
          </p>
        </div>

        <MobileBottomNavigation />
      </div>
    );
  }

  // Versão Desktop
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <MaterialIcon name="arrow_back" />
            <span>Voltar</span>
          </button>
          <button 
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg hover:bg-accent transition-colors"
          >
            <MaterialIcon name="share" className="text-lg" />
            <span>Compartilhar</span>
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Imagem */}
          <div className="relative rounded-2xl overflow-hidden aspect-[3/4]">
            <img 
              src={guitarImage} 
              alt="Violão do Sorteio" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-6 left-6">
              <div className="inline-flex items-center justify-center gap-x-1.5 rounded-full bg-primary/20 border border-primary/50 backdrop-blur-md px-4 py-2 shadow-lg">
                <MaterialIcon name="workspace_premium" className="text-primary text-lg" />
                <p className="text-primary text-sm font-bold tracking-wider uppercase">Benefício PRO</p>
              </div>
            </div>
          </div>

          {/* Conteúdo */}
          <div className="flex flex-col justify-center">
            <span className="text-primary text-sm font-bold uppercase tracking-wider mb-2">
              Sorteio Exclusivo
            </span>
            
            <h1 className="text-4xl font-bold leading-tight mb-4">
              Transforme suas <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">composições</span> com um novo violão.
            </h1>

            <div className="flex items-start gap-3 mb-6">
              <MaterialIcon name="local_shipping" className="text-primary mt-0.5" />
              <p className="text-muted-foreground text-base leading-relaxed">
                Frete <span className="text-primary font-bold">100% grátis</span> para todo o país. O envio é por nossa conta.
              </p>
            </div>

            {/* Card de participação */}
            <div className="bg-card rounded-xl p-5 mb-6 border border-border flex gap-4 items-start">
              <div className="bg-primary/10 p-3 rounded-lg shrink-0">
                <MaterialIcon name="auto_awesome" className="text-primary text-2xl" />
              </div>
              <div>
                <h3 className="text-foreground font-semibold mb-1">Participação Automática</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Sua assinatura PRO ativa garante entrada automática neste e em todos os futuros sorteios da plataforma.
                </p>
              </div>
            </div>

            {/* Barra de progresso */}
            <div className="w-full mb-6">
              <div className="flex justify-between items-end mb-2">
                <p className="text-muted-foreground text-sm font-medium">
                  <span className="text-foreground font-bold">{reservedSlots} de {totalSlots}</span> números já reservados
                </p>
                <p className="text-primary text-sm font-bold uppercase tracking-wider">
                  Últimos {remainingPercent}%!
                </p>
              </div>
              <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary shadow-[0_0_12px_rgba(0,200,83,0.6)] rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Botão */}
            {isPro ? (
              <button 
                onClick={handleParticipate}
                disabled={isParticipating}
                className="group w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 active:scale-[0.98] transition-all duration-200 py-4 px-6 rounded-xl shadow-[0_0_20px_rgba(0,200,83,0.3)] hover:shadow-[0_0_30px_rgba(0,200,83,0.5)] disabled:opacity-70"
              >
                {isParticipating ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary-foreground" />
                ) : (
                  <>
                    <span className="text-primary-foreground font-bold text-lg tracking-wide group-hover:tracking-wider transition-all">
                      QUERO PARTICIPAR
                    </span>
                    <MaterialIcon name="arrow_forward" className="text-primary-foreground group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            ) : (
              <button 
                onClick={() => navigate('/dashboard/subscription-checkout')}
                className="group w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 active:scale-[0.98] transition-all duration-200 py-4 px-6 rounded-xl shadow-[0_0_20px_rgba(249,115,22,0.3)]"
              >
                <MaterialIcon name="lock" className="text-white" />
                <span className="text-white font-bold text-lg tracking-wide">
                  ASSINE PRO PARA PARTICIPAR
                </span>
              </button>
            )}

            <p className="text-center text-muted-foreground text-xs mt-4 uppercase tracking-widest">
              Sorteio auditado e certificado
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sorteio;
