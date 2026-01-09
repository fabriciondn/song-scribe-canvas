import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '@/hooks/useSubscription';
import { toast } from 'sonner';
import { MobileBottomNavigation } from '@/components/mobile/MobileBottomNavigation';
import { useMobileDetection } from '@/hooks/use-mobile';

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

// Simular números indisponíveis (já reservados por outros)
const unavailableNumbers = [1, 2, 7, 17, 18, 45, 67, 89, 102, 156, 203, 287, 312, 356, 401, 423, 467, 489];

const SorteioNumeros: React.FC = () => {
  const navigate = useNavigate();
  const { subscription } = useSubscription();
  const { isMobile } = useMobileDetection();
  
  const isPro = subscription?.status === 'active' && subscription?.plan_type === 'pro';
  
  // Créditos disponíveis para selecionar números (simulado)
  const maxCredits = 5;
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [activeRange, setActiveRange] = useState<string>('001-100');
  const [visibleCount, setVisibleCount] = useState(30);
  const [isConfirming, setIsConfirming] = useState(false);

  const ranges = [
    { label: '001-100', start: 1, end: 100 },
    { label: '101-200', start: 101, end: 200 },
    { label: '201-300', start: 201, end: 300 },
    { label: '301-400', start: 301, end: 400 },
    { label: '401-500', start: 401, end: 500 },
  ];

  const currentRange = ranges.find(r => r.label === activeRange) || ranges[0];

  const numbers = useMemo(() => {
    const nums = [];
    for (let i = currentRange.start; i <= Math.min(currentRange.start + visibleCount - 1, currentRange.end); i++) {
      nums.push(i);
    }
    return nums;
  }, [currentRange, visibleCount]);

  const toggleNumber = (num: number) => {
    if (unavailableNumbers.includes(num)) return;
    
    if (selectedNumbers.includes(num)) {
      setSelectedNumbers(prev => prev.filter(n => n !== num));
    } else {
      if (selectedNumbers.length >= maxCredits) {
        toast.error(`Você pode selecionar no máximo ${maxCredits} números`);
        return;
      }
      setSelectedNumbers(prev => [...prev, num]);
    }
  };

  const formatNumber = (num: number) => {
    return num.toString().padStart(3, '0');
  };

  const handleConfirm = () => {
    if (selectedNumbers.length === 0) {
      toast.error('Selecione pelo menos um número');
      return;
    }
    
    setIsConfirming(true);
    
    setTimeout(() => {
      setIsConfirming(false);
      toast.success('🎉 Números confirmados!', {
        description: `Você está participando com ${selectedNumbers.length} número(s).`,
      });
      navigate('/dashboard/sorteio');
    }, 1500);
  };

  const loadMore = () => {
    setVisibleCount(prev => Math.min(prev + 30, 100));
  };

  const getNumberState = (num: number): 'available' | 'selected' | 'unavailable' => {
    if (unavailableNumbers.includes(num)) return 'unavailable';
    if (selectedNumbers.includes(num)) return 'selected';
    return 'available';
  };

  // Redirecionar se não for PRO
  if (!isPro) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
        <div className="text-center">
          <MaterialIcon name="lock" className="text-6xl text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Acesso Exclusivo PRO</h1>
          <p className="text-muted-foreground mb-6">Assine o plano PRO para participar do sorteio.</p>
          <button 
            onClick={() => navigate('/dashboard/subscription-checkout')}
            className="bg-primary text-primary-foreground font-bold px-6 py-3 rounded-xl"
          >
            Assinar PRO
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 flex items-center bg-background/80 backdrop-blur-md p-4 pb-2 justify-between border-b border-border">
        <button 
          onClick={() => navigate('/dashboard/sorteio')}
          className="text-foreground flex size-12 shrink-0 items-center justify-center hover:bg-accent rounded-full transition-colors"
        >
          <MaterialIcon name="arrow_back" className="text-[24px]" />
        </button>
        <h2 className="text-foreground text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">Sorteio PRO</h2>
        <div className="flex w-12 items-center justify-end">
          <button className="flex size-12 cursor-pointer items-center justify-center overflow-hidden rounded-full hover:bg-accent transition-colors text-foreground">
            <MaterialIcon name="info" className="text-[24px]" />
          </button>
        </div>
      </div>

      {/* Título */}
      <div className="px-4 pt-6 pb-2">
        <h1 className="text-foreground tracking-tight text-3xl font-bold leading-tight mb-2">Escolha seu número</h1>
        <p className="text-muted-foreground text-base font-normal leading-relaxed">
          Participe do sorteio exclusivo de um <span className="text-foreground font-medium">Violão Taylor</span>. Selecione seus números da sorte abaixo.
        </p>
      </div>

      {/* Card de Status PRO */}
      <div className="p-4">
        <div className="relative overflow-hidden rounded-xl bg-card border border-primary/20 shadow-[0_0_15px_rgba(19,236,91,0.1)]">
          <div className="absolute top-0 right-0 -mr-8 -mt-8 h-32 w-32 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          <div className="relative flex flex-col p-5 gap-4">
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 mb-1">
                  <MaterialIcon name="confirmation_number" className="text-primary text-[20px]" />
                  <p className="text-primary text-sm font-bold uppercase tracking-wider">Status PRO</p>
                </div>
                <p className="text-foreground text-xl font-bold leading-tight">{maxCredits} créditos disponíveis</p>
                <p className="text-muted-foreground text-sm font-normal leading-normal">
                  Você já selecionou {selectedNumbers.length} de {maxCredits} números.
                </p>
              </div>
            </div>
            <button 
              onClick={() => navigate('/dashboard/acordes')}
              className="group flex w-full items-center justify-between rounded-lg bg-accent/50 p-3 hover:bg-accent transition-colors border border-border"
            >
              <span className="text-sm font-medium text-foreground pl-1">Como ganhar mais números?</span>
              <div className="flex size-8 items-center justify-center rounded-full bg-muted group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                <MaterialIcon name="arrow_forward" className="text-[18px]" />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Filtros de Range */}
      <div className="flex gap-3 px-4 py-2 overflow-x-auto no-scrollbar">
        {ranges.map((range) => (
          <button
            key={range.label}
            onClick={() => {
              setActiveRange(range.label);
              setVisibleCount(30);
            }}
            className={`flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full px-4 transition-all active:scale-95 ${
              activeRange === range.label
                ? 'bg-primary text-primary-foreground shadow-[0_0_10px_rgba(19,236,91,0.3)] font-bold'
                : 'bg-card border border-border hover:border-primary/30 font-medium'
            }`}
          >
            <span className="text-sm leading-normal">{range.label}</span>
          </button>
        ))}
      </div>

      {/* Legenda */}
      <div className="flex items-center justify-center gap-6 py-4 px-4 text-xs font-medium text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="size-3 rounded-full border border-border bg-background" />
          <span>Disponível</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="size-3 rounded-full bg-primary" />
          <span className="text-foreground">Selecionado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="size-3 rounded-full bg-muted" />
          <span>Indisponível</span>
        </div>
      </div>

      {/* Grid de Números */}
      <div className="px-4 pb-6">
        <div className="grid grid-cols-5 gap-3 sm:grid-cols-6 md:grid-cols-8">
          {numbers.map((num) => {
            const state = getNumberState(num);
            
            return (
              <button
                key={num}
                onClick={() => toggleNumber(num)}
                disabled={state === 'unavailable'}
                className={`aspect-square flex flex-col items-center justify-center rounded-lg text-sm font-medium transition-all ${
                  state === 'selected'
                    ? 'bg-primary text-primary-foreground font-bold shadow-[0_0_12px_rgba(19,236,91,0.4)] scale-105'
                    : state === 'unavailable'
                    ? 'bg-muted text-muted-foreground/40 cursor-not-allowed'
                    : 'bg-background border border-border hover:border-primary hover:text-primary'
                }`}
              >
                {formatNumber(num)}
                {state === 'selected' && (
                  <MaterialIcon name="check" className="text-[14px] mt-0.5" />
                )}
              </button>
            );
          })}
        </div>
        
        {visibleCount < 100 && (
          <div className="mt-8 flex justify-center">
            <button 
              onClick={loadMore}
              className="text-sm font-medium text-primary hover:text-foreground transition-colors underline underline-offset-4"
            >
              Carregar mais números
            </button>
          </div>
        )}
      </div>

      {/* Botão Fixo */}
      <div className="fixed bottom-0 left-0 z-20 w-full bg-gradient-to-t from-background via-background/95 to-transparent pb-8 pt-8 px-4">
        <button 
          onClick={handleConfirm}
          disabled={selectedNumbers.length === 0 || isConfirming}
          className="flex w-full cursor-pointer items-center justify-center rounded-xl bg-primary py-4 text-primary-foreground shadow-lg shadow-primary/20 transition-transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isConfirming ? (
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary-foreground" />
          ) : (
            <>
              <span className="text-base font-bold leading-normal mr-2">
                Confirmar ({selectedNumbers.length}) número{selectedNumbers.length !== 1 ? 's' : ''}
              </span>
              <MaterialIcon name="arrow_forward" className="text-[20px]" />
            </>
          )}
        </button>
        <p className="mt-4 text-center text-[10px] text-muted-foreground uppercase tracking-widest">
          Regulado pela Loteria Federal do Brasil
        </p>
      </div>

      {isMobile && <MobileBottomNavigation />}

      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default SorteioNumeros;
