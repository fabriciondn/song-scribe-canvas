import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '@/hooks/useSubscription';
import { useUserCredits } from '@/hooks/useUserCredits';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { raffleService } from '@/services/raffleService';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { MobileBottomNavigation } from '@/components/mobile/MobileBottomNavigation';
import { useMobileDetection } from '@/hooks/use-mobile';
import { Loader2, X } from 'lucide-react';

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

const SorteioNumeros: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { subscription } = useSubscription();
  const { credits } = useUserCredits();
  const { user } = useAuth();
  const { isMobile } = useMobileDetection();
  
  const isPro = subscription?.status === 'active' && subscription?.plan_type === 'pro';
  
  const [activeRange, setActiveRange] = useState<string>('001-100');
  const [visibleCount, setVisibleCount] = useState(30);
  const [isConfirming, setIsConfirming] = useState(false);
  const [pendingSelections, setPendingSelections] = useState<number[]>([]);
  const [showMyNumbers, setShowMyNumbers] = useState(false);

  // Buscar configurações do sorteio
  const { data: raffleSettings, isLoading: loadingRaffle } = useQuery({
    queryKey: ['active-raffle'],
    queryFn: raffleService.getActiveRaffle
  });

  // Buscar todas as reservas do sorteio
  const { data: allReservations = [], isLoading: loadingReservations } = useQuery({
    queryKey: ['raffle-reservations', raffleSettings?.id],
    queryFn: () => raffleService.getReservations(raffleSettings!.id),
    enabled: !!raffleSettings?.id
  });

  // Buscar reservas do usuário atual
  const { data: userReservations = [] } = useQuery({
    queryKey: ['user-raffle-reservations', raffleSettings?.id, user?.id],
    queryFn: () => raffleService.getUserReservations(raffleSettings!.id, user!.id),
    enabled: !!raffleSettings?.id && !!user?.id
  });

  // Mutation para reservar número
  const reserveMutation = useMutation({
    mutationFn: async (numbers: number[]) => {
      if (!raffleSettings?.id || !user?.id) throw new Error('Dados inválidos');
      
      const results = [];
      for (const num of numbers) {
        const result = await raffleService.reserveNumber(raffleSettings.id, user.id, num);
        results.push(result);
      }
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['raffle-reservations'] });
      queryClient.invalidateQueries({ queryKey: ['user-raffle-reservations'] });
      setPendingSelections([]);
      toast.success('🎉 Números confirmados!', {
        description: `Você está participando com ${userReservations.length + pendingSelections.length} número(s).`,
      });
      navigate('/dashboard/sorteio');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao reservar números');
    }
  });

  // Calcular números disponíveis para o usuário
  const baseNumbers = raffleSettings?.base_numbers_for_pro || 1;
  const numbersPerCredit = raffleSettings?.numbers_per_credit || 1;
  const maxNumbers = isPro ? baseNumbers + ((credits || 0) * numbersPerCredit) : 0;
  const alreadyReserved = userReservations.length;
  const availableToSelect = maxNumbers - alreadyReserved;

  // Números já reservados por outros (não pelo usuário atual)
  const unavailableNumbers = useMemo(() => {
    return allReservations
      .filter(r => r.user_id !== user?.id)
      .map(r => r.number);
  }, [allReservations, user?.id]);

  // Números já reservados pelo usuário atual
  const myReservedNumbers = useMemo(() => {
    return userReservations.map(r => r.number);
  }, [userReservations]);

  const totalNumbers = raffleSettings?.total_numbers || 1000;

  const ranges = useMemo(() => {
    const result = [];
    for (let i = 0; i < totalNumbers; i += 100) {
      const start = i + 1;
      const end = Math.min(i + 100, totalNumbers);
      result.push({
        label: `${String(start).padStart(3, '0')}-${String(end).padStart(3, '0')}`,
        start,
        end
      });
    }
    return result;
  }, [totalNumbers]);

  const currentRange = ranges.find(r => r.label === activeRange) || ranges[0];

  const numbers = useMemo(() => {
    const nums = [];
    for (let i = currentRange.start; i <= Math.min(currentRange.start + visibleCount - 1, currentRange.end); i++) {
      nums.push(i);
    }
    return nums;
  }, [currentRange, visibleCount]);

  const toggleNumber = (num: number) => {
    if (unavailableNumbers.includes(num) || myReservedNumbers.includes(num)) return;
    
    if (pendingSelections.includes(num)) {
      setPendingSelections(prev => prev.filter(n => n !== num));
    } else {
      if (pendingSelections.length >= availableToSelect) {
        toast.error(`Você pode selecionar no máximo ${availableToSelect} número${availableToSelect !== 1 ? 's' : ''} adicionais`);
        return;
      }
      setPendingSelections(prev => [...prev, num]);
    }
  };

  const formatNumber = (num: number) => {
    return num.toString().padStart(3, '0');
  };

  const handleConfirm = () => {
    if (pendingSelections.length === 0) {
      toast.error('Selecione pelo menos um número');
      return;
    }
    
    setIsConfirming(true);
    reserveMutation.mutate(pendingSelections);
  };

  const loadMore = () => {
    setVisibleCount(prev => Math.min(prev + 30, 100));
  };

  const getNumberState = (num: number): 'available' | 'selected' | 'mine' | 'unavailable' => {
    if (unavailableNumbers.includes(num)) return 'unavailable';
    if (myReservedNumbers.includes(num)) return 'mine';
    if (pendingSelections.includes(num)) return 'selected';
    return 'available';
  };

  // Loading
  if (loadingRaffle || loadingReservations) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando sorteio...</p>
        </div>
      </div>
    );
  }

  // Sorteio não encontrado ou inativo
  if (!raffleSettings) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
        <div className="text-center">
          <MaterialIcon name="event_busy" className="text-6xl text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Sorteio Indisponível</h1>
          <p className="text-muted-foreground mb-6">Não há sorteio ativo no momento.</p>
          <button 
            onClick={() => navigate('/dashboard')}
            className="bg-primary text-primary-foreground font-bold px-6 py-3 rounded-xl"
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    );
  }

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
    <div className="min-h-screen bg-background text-foreground flex flex-col pb-48">
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

      <div className="px-4 pt-6 pb-2">
        <h1 className="text-foreground tracking-tight text-3xl font-bold leading-tight mb-2">Escolha seu número</h1>
        <p className="text-muted-foreground text-base font-normal leading-relaxed">
          Participe do sorteio: <span className="text-foreground font-medium">{raffleSettings.name}</span>. Selecione seus números da sorte abaixo.
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
                  <p className="text-primary text-sm font-bold uppercase tracking-wider">Benefício PRO</p>
                </div>
                <p className="text-foreground text-xl font-bold leading-tight">{maxNumbers} número{maxNumbers !== 1 ? 's' : ''} no total</p>
                <p className="text-muted-foreground text-sm font-normal leading-normal">
                  Você já reservou {alreadyReserved} • Pode selecionar mais {availableToSelect} número{availableToSelect !== 1 ? 's' : ''}.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => navigate('/dashboard/acordes')}
                className="group flex flex-1 items-center justify-between rounded-lg bg-accent/50 p-3 hover:bg-accent transition-colors border border-border"
              >
                <span className="text-sm font-medium text-foreground pl-1">Como ganhar mais números?</span>
                <div className="flex size-8 items-center justify-center rounded-full bg-muted group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                  <MaterialIcon name="arrow_forward" className="text-[18px]" />
                </div>
              </button>
              {myReservedNumbers.length > 0 && (
                <button 
                  onClick={() => setShowMyNumbers(true)}
                  className="flex items-center justify-center rounded-lg bg-blue-500/10 p-3 hover:bg-blue-500/20 transition-colors border border-blue-500/30"
                >
                  <MaterialIcon name="visibility" className="text-blue-500 text-[20px]" />
                </button>
              )}
            </div>
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
      <div className="flex flex-wrap items-center justify-center gap-4 py-4 px-4 text-xs font-medium text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="size-3 rounded-full border border-border bg-background" />
          <span>Disponível</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="size-3 rounded-full bg-primary" />
          <span className="text-foreground">Selecionado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="size-3 rounded-full bg-blue-500" />
          <span className="text-blue-500">Meu número</span>
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
                disabled={state === 'unavailable' || state === 'mine'}
                className={`aspect-square flex flex-col items-center justify-center rounded-lg text-sm font-medium transition-all ${
                  state === 'selected'
                    ? 'bg-primary text-primary-foreground font-bold shadow-[0_0_12px_rgba(19,236,91,0.4)] scale-105'
                    : state === 'mine'
                    ? 'bg-blue-500 text-white font-bold cursor-default'
                    : state === 'unavailable'
                    ? 'bg-muted text-muted-foreground/40 cursor-not-allowed'
                    : 'bg-background border border-border hover:border-primary hover:text-primary'
                }`}
              >
                {formatNumber(num)}
                {(state === 'selected' || state === 'mine') && (
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
      {pendingSelections.length > 0 && (
        <div className="fixed bottom-20 left-0 z-20 w-full bg-gradient-to-t from-background via-background/95 to-transparent pb-4 pt-6 px-4 animate-in slide-in-from-bottom-4 duration-300">
          <button 
            onClick={handleConfirm}
            disabled={isConfirming || reserveMutation.isPending}
            className="flex w-full cursor-pointer items-center justify-center rounded-xl bg-primary py-4 text-primary-foreground shadow-lg shadow-primary/20 transition-transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isConfirming || reserveMutation.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <span className="text-base font-bold leading-normal mr-2">
                  Confirmar ({pendingSelections.length}) número{pendingSelections.length !== 1 ? 's' : ''}
                </span>
                <MaterialIcon name="arrow_forward" className="text-[20px]" />
              </>
            )}
          </button>
          <p className="mt-4 text-center text-[10px] text-muted-foreground uppercase tracking-widest">
            Regulado pela Loteria Federal do Brasil
          </p>
        </div>
      )}

      {isMobile && <MobileBottomNavigation />}

      {/* Modal Ver Meus Números */}
      {showMyNumbers && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <MaterialIcon name="confirmation_number" className="text-blue-500 text-[24px]" />
                <h3 className="text-lg font-bold text-foreground">Meus Números</h3>
              </div>
              <button 
                onClick={() => setShowMyNumbers(false)}
                className="flex size-10 items-center justify-center rounded-full hover:bg-accent transition-colors"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            
            <div className="p-4">
              <p className="text-muted-foreground text-sm mb-4">
                Você reservou <span className="text-foreground font-bold">{myReservedNumbers.length}</span> número{myReservedNumbers.length !== 1 ? 's' : ''} neste sorteio.
              </p>
              
              {myReservedNumbers.length > 0 ? (
                <div className="grid grid-cols-5 gap-2 max-h-60 overflow-y-auto">
                  {myReservedNumbers.sort((a, b) => a - b).map((num) => (
                    <div
                      key={num}
                      className="aspect-square flex items-center justify-center rounded-lg bg-blue-500 text-white text-sm font-bold"
                    >
                      {formatNumber(num)}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <MaterialIcon name="inbox" className="text-4xl mb-2" />
                  <p>Você ainda não reservou nenhum número.</p>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-border">
              <button 
                onClick={() => setShowMyNumbers(false)}
                className="w-full py-3 rounded-xl bg-accent hover:bg-accent/80 text-foreground font-medium transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

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
