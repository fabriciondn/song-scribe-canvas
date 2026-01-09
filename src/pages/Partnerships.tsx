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
              <p className="text-xs text-muted-foreground mt-1">Gerencie seu token para colaborar em registros autorais</p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={toggleTheme}
                className="p-2 rounded-full bg-card border border-border hover:bg-muted transition-colors"
              >
                {theme === 'dark' ? (
                  <Sun className="h-5 w-5 text-primary" />
                ) : (
                  <Moon className="h-5 w-5 text-primary" />
                )}
              </button>
              <button className="p-2 rounded-full bg-card border border-border hover:bg-muted transition-colors">
                <Bell className="h-5 w-5 text-primary" />
              </button>
            </div>
          </header>

          {/* Meu Token de Compositor Section */}
          <section className="mb-6 w-full bg-card border border-border rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Key className="h-5 w-5 text-foreground" />
              <h2 className="font-bold text-foreground text-sm uppercase tracking-wide">Meu Token de Compositor</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-8 leading-relaxed">
              Compartilhe seu token para que outros compositores possam te adicionar como coautor em registros autorais.
            </p>
            
            {isLoading ? (
              <div className="flex flex-col items-center text-center">
                <Skeleton className="w-12 h-12 rounded-full mb-4" />
                <Skeleton className="h-4 w-48 mb-2" />
                <Skeleton className="h-3 w-32" />
              </div>
            ) : myToken ? (
              <div className="space-y-4">
                <div className="bg-muted/50 border border-border rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Seu Token</p>
                  <p className="font-mono text-sm text-foreground break-all">{myToken.token}</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Expira em: {formatDate(myToken.expires_at)}</span>
                  {isTokenExpiringSoon(myToken.expires_at) && (
                    <Badge variant="destructive" className="text-[10px]">Expirando</Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleCopyToken}
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    {isCopied ? 'Copiado!' : 'Copiar Token'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleRevokeToken}
                    className="text-destructive border-destructive/30 hover:bg-destructive/10"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4 ring-1 ring-border">
                  <Key className="h-5 w-5 text-muted-foreground" />
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-1">Você ainda não possui um token</h3>
                <p className="text-[10px] text-muted-foreground mb-5 max-w-[220px]">
                  Gere um token para que outros compositores possam te adicionar como coautor.
                </p>
                <Button 
                  onClick={handleGenerateToken}
                  disabled={isGenerating}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 rounded-lg flex items-center gap-2 shadow-lg shadow-primary/20"
                >
                  <Key className="h-4 w-4" />
                  {isGenerating ? 'Gerando...' : 'Gerar Token'}
                </Button>
              </div>
            )}
          </section>

          {/* Como Funciona Section */}
          <section className="mb-6 w-full bg-card border border-border rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-foreground" />
              <h2 className="font-bold text-foreground text-sm uppercase tracking-wide">Como Funciona</h2>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div className="bg-muted/50 rounded-lg p-4 border border-border/50 flex flex-col items-start">
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold mb-2 ring-1 ring-primary/20">1</div>
                <h3 className="text-xs font-bold text-foreground mb-1">Gere seu Token</h3>
                <p className="text-[10px] text-muted-foreground leading-relaxed">Crie um token único que identifica você como compositor.</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 border border-border/50 flex flex-col items-start">
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold mb-2 ring-1 ring-primary/20">2</div>
                <h3 className="text-xs font-bold text-foreground mb-1">Compartilhe</h3>
                <p className="text-[10px] text-muted-foreground leading-relaxed">Envie seu token para o parceiro que fará o registro autoral.</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 border border-border/50 flex flex-col items-start">
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold mb-2 ring-1 ring-primary/20">3</div>
                <h3 className="text-xs font-bold text-foreground mb-1">Seja Adicionado</h3>
                <p className="text-[10px] text-muted-foreground leading-relaxed">Seu nome e CPF serão preenchidos automaticamente como coautor.</p>
              </div>
            </div>
          </section>

          {/* Registros em Parceria Section */}
          <section className="w-full bg-card border border-border rounded-xl p-6 shadow-sm mb-8">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-5 w-5 text-foreground" />
              <h2 className="font-bold text-foreground text-sm uppercase tracking-wide">Registros em Parceria</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-8">
              Registros autorais onde você participa como autor ou coautor.
            </p>
            
            {partnershipRegistrations.length > 0 ? (
              <div className="space-y-3">
                {partnershipRegistrations.map((registration, idx) => (
                  <div key={idx} className="bg-muted/50 rounded-lg p-4 border border-border/50">
                    <h4 className="font-medium text-sm text-foreground">{registration.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {registration.coauthors?.join(', ') || 'Sem coautores'}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center text-center pb-6">
                <div className="mb-4 opacity-20">
                  <FileText className="h-12 w-12 text-foreground" />
                </div>
                <h3 className="text-sm font-medium text-foreground mb-1">Nenhum registro em parceria encontrado</h3>
                <p className="text-[10px] text-muted-foreground">
                  Registros com coautores aparecerão aqui.
                </p>
              </div>
            )}
          </section>
        </div>

        {/* Bottom Navigation */}
        <MobileBottomNavigation />
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
