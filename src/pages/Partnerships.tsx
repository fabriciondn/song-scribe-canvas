import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Key, 
  Copy, 
  RefreshCw, 
  Clock, 
  FileText, 
  Users, 
  CheckCircle2,
  Search,
  UserPlus,
  ChevronRight,
  Settings,
  Bell,
  Sun,
  Moon,
  Music
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTheme } from '@/hooks/useTheme';
import { 
  getMyActiveToken, 
  generateComposerToken, 
  revokeMyToken,
  getPartnershipRegistrations,
  ComposerToken
} from '@/services/composerTokenService';
import { ProOnlyWrapper } from '@/components/layout/ProOnlyWrapper';
import { MobileBottomNavigation } from '@/components/mobile/MobileBottomNavigation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Mock data for active partners
const MOCK_PARTNERS = [
  {
    id: '1',
    name: 'Ana Silva',
    role: 'Letrista',
    projects: 3,
    splitAverage: 25,
    status: 'active',
    avatar: null,
    projectBadges: [
      { id: 'p1', color: 'bg-blue-500' },
      { id: 'p2', color: 'bg-purple-500' },
      { id: 'p3', color: 'bg-orange-500' },
    ]
  },
  {
    id: '2',
    name: 'Lucas Mendes',
    role: 'Produtor',
    projects: 1,
    splitAverage: 50,
    status: 'active',
    avatar: null,
    projectBadges: [
      { id: 'm1', color: 'bg-indigo-500' },
    ]
  },
  {
    id: '3',
    name: 'João Marco',
    initials: 'JM',
    role: 'Arranjador',
    status: 'pending',
    avatar: null,
    gradientFrom: 'from-pink-400',
    gradientTo: 'to-red-500'
  }
];

// Mock suggestions
const MOCK_SUGGESTIONS = [
  { id: '1', name: 'Beatriz', role: 'Vocalista', avatar: null },
  { id: '2', name: 'Carlos D.', role: 'Guitarrista', avatar: null },
  { id: '3', name: 'Studio X', role: 'Mix & Master', avatar: null, isStudio: true },
];

const Partnerships: React.FC = () => {
  const [myToken, setMyToken] = useState<ComposerToken | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [partnershipRegistrations, setPartnershipRegistrations] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const { toast } = useToast();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const { theme, toggleTheme } = useTheme();
  
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [token, registrations] = await Promise.all([
        getMyActiveToken(),
        getPartnershipRegistrations()
      ]);
      setMyToken(token);
      setPartnershipRegistrations(registrations);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGenerateToken = async () => {
    setIsGenerating(true);
    try {
      const token = await generateComposerToken(30);
      setMyToken(token);
      toast({
        title: 'Token gerado!',
        description: 'Seu novo token de compositor foi criado com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao gerar token:', error);
      toast({
        title: 'Erro ao gerar token',
        description: 'Não foi possível gerar um novo token. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleCopyToken = () => {
    if (myToken) {
      navigator.clipboard.writeText(myToken.token);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 3000);
      
      toast({
        title: 'Token copiado!',
        description: 'O token foi copiado para a área de transferência.',
      });
    }
  };
  
  const handleRevokeToken = async () => {
    try {
      await revokeMyToken();
      setMyToken(null);
      toast({
        title: 'Token revogado',
        description: 'Seu token foi revogado e não poderá mais ser usado.',
      });
    } catch (error) {
      console.error('Erro ao revogar token:', error);
      toast({
        title: 'Erro ao revogar token',
        description: 'Não foi possível revogar o token.',
        variant: 'destructive',
      });
    }
  };
  
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };
  
  const isTokenExpiringSoon = (expiresAt: string) => {
    const expDate = new Date(expiresAt);
    const now = new Date();
    const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  if (isLoading && isMobile) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="px-5 pt-14 pb-4">
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="px-5 space-y-4">
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background pb-24">
        {/* Status bar spacer */}
        <div className="h-12 w-full fixed top-0 left-0 bg-background/90 backdrop-blur-md z-50" />
        
        <div className="pt-14 pb-10 px-5 max-w-md mx-auto relative min-h-screen flex flex-col">
          {/* Header */}
          <header className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Parcerias</h1>
              <p className="text-sm text-muted-foreground mt-1">Gerencie seus colaboradores</p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={toggleTheme}
                className="p-2 rounded-full bg-muted border border-border hover:bg-muted/80 transition-colors"
              >
                {theme === 'dark' ? (
                  <Sun className="h-5 w-5 text-primary" />
                ) : (
                  <Moon className="h-5 w-5 text-primary" />
                )}
              </button>
              <button className="p-2 rounded-full bg-muted border border-border hover:bg-muted/80 transition-colors">
                <Bell className="h-5 w-5 text-primary" />
              </button>
            </div>
          </header>

          {/* Search */}
          <div className="relative mb-8">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar parceiro..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full py-3 pl-10 pr-4 h-12 bg-muted border-border rounded-xl text-base placeholder-muted-foreground"
            />
          </div>

          {/* Invite Button */}
          <div className="mb-8">
            <button className="w-full group relative overflow-hidden rounded-2xl bg-primary p-5 shadow-lg shadow-primary/30 transition-all active:scale-[0.98]">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center space-x-4">
                  <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
                    <UserPlus className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-primary-foreground font-semibold text-lg">Convidar Novo</h3>
                    <p className="text-primary-foreground/80 text-xs">Adicione compositores ou músicos</p>
                  </div>
                </div>
                <ChevronRight className="h-6 w-6 text-primary-foreground" />
              </div>
            </button>
          </div>

          {/* Active Partners Section */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground">Ativos</h2>
            <button className="text-xs font-medium text-primary hover:text-primary/80 transition-colors">Ver todos</button>
          </div>

          <div className="space-y-4 mb-8">
            {MOCK_PARTNERS.map((partner) => (
              <div 
                key={partner.id}
                className={`group bg-muted p-4 rounded-xl border border-border shadow-sm hover:shadow-md transition-all ${partner.status === 'pending' ? 'opacity-80' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      {partner.initials ? (
                        <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${partner.gradientFrom} ${partner.gradientTo} flex items-center justify-center text-white font-bold ring-2 ring-border`}>
                          {partner.initials}
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-primary font-bold ring-2 ring-border">
                          {getInitials(partner.name)}
                        </div>
                      )}
                      {partner.status === 'active' && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-primary rounded-full border-2 border-muted" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{partner.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {partner.role} • {partner.status === 'pending' ? 'Pendente' : `${partner.projects} Projeto${partner.projects !== 1 ? 's' : ''}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {partner.status === 'pending' ? (
                      <span className="px-2 py-1 rounded-md bg-yellow-500/20 text-yellow-500 text-[10px] font-bold">
                        AGUARDANDO
                      </span>
                    ) : (
                      <>
                        <span className="block font-bold text-primary">{partner.splitAverage}%</span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Split Médio</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border flex justify-between items-center">
                  {partner.status === 'pending' ? (
                    <div className="flex-1" />
                  ) : (
                    <div className="flex -space-x-2">
                      {partner.projectBadges?.map((badge, idx) => (
                        <div 
                          key={badge.id}
                          className={`w-6 h-6 rounded-full ${badge.color} flex items-center justify-center text-[8px] text-white border border-muted`}
                        >
                          {badge.id.toUpperCase()}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {partner.status === 'pending' ? (
                    <div className="flex items-center space-x-3">
                      <button className="text-xs font-medium text-destructive hover:text-destructive/80">Cancelar</button>
                      <button className="text-xs font-medium text-primary hover:text-primary/80">Reenviar</button>
                    </div>
                  ) : (
                    <button className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors flex items-center">
                      Gerenciar
                      <Settings className="h-4 w-4 ml-1" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Suggestions Section */}
          <h2 className="text-lg font-bold mb-4 text-foreground">Sugestões para você</h2>
          <div className="flex space-x-4 overflow-x-auto pb-4 hide-scrollbar">
            {MOCK_SUGGESTIONS.map((suggestion) => (
              <div 
                key={suggestion.id}
                className="min-w-[140px] bg-muted p-3 rounded-xl border border-border shadow-sm flex flex-col items-center text-center"
              >
                {suggestion.isStudio ? (
                  <div className="w-14 h-14 rounded-full mb-2 bg-muted-foreground/10 flex items-center justify-center">
                    <Music className="h-6 w-6 text-muted-foreground" />
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-full mb-2 bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-primary font-bold">
                    {getInitials(suggestion.name)}
                  </div>
                )}
                <h4 className="font-medium text-sm truncate w-full text-foreground">{suggestion.name}</h4>
                <p className="text-[10px] text-muted-foreground mb-2">{suggestion.role}</p>
                <button className="text-xs bg-muted-foreground/10 hover:bg-primary hover:text-primary-foreground text-foreground py-1 px-3 rounded-full transition-colors w-full">
                  Conectar
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Navigation */}
        <MobileBottomNavigation />

        {/* Hide scrollbar styles */}
        <style>{`
          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .hide-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>
      </div>
    );
  }

  // Desktop version (keep existing)
  return (
    <ProOnlyWrapper featureName="Parcerias">
      <div className="max-w-4xl mx-auto px-2 sm:px-4 pb-20 sm:pb-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold">Parcerias</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Gerencie seu token para colaborar em registros autorais
            </p>
          </div>
        </div>
        
        {/* Meu Token de Compositor */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Key className="h-5 w-5" />
              Meu Token de Compositor
            </CardTitle>
            <CardDescription>
              Compartilhe seu token para que outros compositores possam te adicionar como coautor em registros autorais.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : myToken ? (
              <>
                <div className="space-y-3">
                  <Label>Seu Token Ativo</Label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      value={myToken.token}
                      readOnly
                      className="font-mono text-sm flex-1 bg-muted"
                    />
                    <Button
                      variant="outline"
                      onClick={handleCopyToken}
                      className="shrink-0"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      {isCopied ? 'Copiado!' : 'Copiar'}
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Expira em: {formatDate(myToken.expires_at)}</span>
                    </div>
                    {isTokenExpiringSoon(myToken.expires_at) && (
                      <Badge variant="destructive" className="text-xs">
                        Expirando em breve
                      </Badge>
                    )}
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    variant="outline"
                    onClick={handleGenerateToken}
                    disabled={isGenerating}
                    className="flex-1"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
                    Gerar Novo Token
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleRevokeToken}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    Revogar Token
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-6 space-y-4">
                <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <Key className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <p className="font-medium">Você ainda não possui um token</p>
                  <p className="text-sm text-muted-foreground">
                    Gere um token para que outros compositores possam te adicionar como coautor.
                  </p>
                </div>
                <Button onClick={handleGenerateToken} disabled={isGenerating}>
                  <Key className="h-4 w-4 mr-2" />
                  {isGenerating ? 'Gerando...' : 'Gerar Token'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Como Funciona */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5" />
              Como Funciona
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex flex-col items-center text-center p-4 rounded-lg bg-muted/50">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <span className="text-primary font-bold">1</span>
                </div>
                <h4 className="font-medium mb-1">Gere seu Token</h4>
                <p className="text-sm text-muted-foreground">
                  Crie um token único que identifica você como compositor.
                </p>
              </div>
              
              <div className="flex flex-col items-center text-center p-4 rounded-lg bg-muted/50">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <span className="text-primary font-bold">2</span>
                </div>
                <h4 className="font-medium mb-1">Compartilhe</h4>
                <p className="text-sm text-muted-foreground">
                  Envie seu token para o parceiro que fará o registro autoral.
                </p>
              </div>
              
              <div className="flex flex-col items-center text-center p-4 rounded-lg bg-muted/50">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <span className="text-primary font-bold">3</span>
                </div>
                <h4 className="font-medium mb-1">Seja Adicionado</h4>
                <p className="text-sm text-muted-foreground">
                  Seu nome e CPF serão preenchidos automaticamente como coautor.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Histórico de Parcerias */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5" />
              Registros em Parceria
            </CardTitle>
            <CardDescription>
              Registros autorais onde você participa como autor ou coautor.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {partnershipRegistrations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum registro em parceria encontrado.</p>
                <p className="text-sm mt-1">
                  Registros com coautores aparecerão aqui.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {partnershipRegistrations.map((registration) => (
                  <div 
                    key={registration.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{registration.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {registration.author} • {formatDate(registration.created_at)}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          <Users className="h-3 w-3 mr-1" />
                          {(registration.other_authors?.length || 0) + 1} autores
                        </Badge>
                        {registration.status === 'registered' && (
                          <Badge variant="default" className="text-xs bg-green-600">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Registrado
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ProOnlyWrapper>
  );
};

export default Partnerships;
