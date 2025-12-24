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
import { Key, Copy, RefreshCw, Clock, FileText, Users, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { 
  getMyActiveToken, 
  generateComposerToken, 
  revokeMyToken,
  getPartnershipRegistrations,
  ComposerToken
} from '@/services/composerTokenService';
import { ProOnlyWrapper } from '@/components/layout/ProOnlyWrapper';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Partnerships: React.FC = () => {
  const [myToken, setMyToken] = useState<ComposerToken | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [partnershipRegistrations, setPartnershipRegistrations] = useState<any[]>([]);
  
  const { toast } = useToast();
  const { user } = useAuth();
  
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
      const token = await generateComposerToken(30); // 30 dias de validade
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
