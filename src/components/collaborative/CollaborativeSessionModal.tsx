import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Users, Loader2, Check } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { 
  createCollaborativeSession, 
  joinSession,
  CollaborativeSession 
} from '@/services/collaborativeSessionService';

interface CollaborativeSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  draftId?: string;
  draftTitle?: string;
  onSessionCreated?: (session: CollaborativeSession) => void;
  onSessionJoined?: (session: CollaborativeSession, draftId: string) => void;
}

export const CollaborativeSessionModal: React.FC<CollaborativeSessionModalProps> = ({
  isOpen,
  onClose,
  draftId,
  draftTitle,
  onSessionCreated,
  onSessionJoined
}) => {
  const [activeTab, setActiveTab] = useState<string>(draftId ? 'create' : 'join');
  const [token, setToken] = useState('');
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCreateSession = async () => {
    if (!draftId) return;
    
    setIsLoading(true);
    try {
      const session = await createCollaborativeSession(draftId);
      setGeneratedToken(session.session_token);
      
      toast({
        title: 'Sessão criada!',
        description: 'Compartilhe o token com seu parceiro para iniciar a composição.',
      });

      if (onSessionCreated) {
        onSessionCreated(session);
      }
    } catch (error) {
      console.error('Erro ao criar sessão:', error);
      toast({
        title: 'Erro ao criar sessão',
        description: 'Não foi possível criar a sessão colaborativa.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinSession = async () => {
    if (!token.trim()) {
      toast({
        title: 'Token obrigatório',
        description: 'Por favor, insira o token da sessão.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const { session, draftId } = await joinSession(token.trim());
      
      toast({
        title: 'Conectado!',
        description: 'Você entrou na sessão colaborativa.',
      });

      if (onSessionJoined) {
        onSessionJoined(session, draftId);
      }
      
      onClose();
    } catch (error: any) {
      console.error('Erro ao entrar na sessão:', error);
      toast({
        title: 'Erro ao entrar na sessão',
        description: error.message || 'Token inválido ou sessão expirada.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyToken = async () => {
    if (!generatedToken) return;
    
    try {
      await navigator.clipboard.writeText(generatedToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      toast({
        title: 'Token copiado!',
        description: 'O token foi copiado para a área de transferência.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao copiar',
        description: 'Não foi possível copiar o token.',
        variant: 'destructive',
      });
    }
  };

  const handleClose = () => {
    setToken('');
    setGeneratedToken(null);
    setCopied(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Composição Colaborativa
          </DialogTitle>
          <DialogDescription>
            Compose em tempo real com outro compositor.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create" disabled={!draftId}>
              Criar Sessão
            </TabsTrigger>
            <TabsTrigger value="join">
              Entrar em Sessão
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-4 mt-4">
            {generatedToken ? (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <Label className="text-sm text-muted-foreground">Token da Sessão</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <code className="flex-1 p-2 bg-background rounded text-sm font-mono break-all">
                      {generatedToken}
                    </code>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleCopyToken}
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Compartilhe este token com seu parceiro. Ele pode usá-lo para entrar na sessão e começar a compor junto com você.
                </p>
                <Button className="w-full" onClick={handleClose}>
                  Iniciar Composição
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {draftTitle && (
                  <div className="p-4 bg-muted rounded-lg">
                    <Label className="text-sm text-muted-foreground">Rascunho</Label>
                    <p className="font-medium mt-1">{draftTitle}</p>
                  </div>
                )}
                <p className="text-sm text-muted-foreground">
                  Ao criar uma sessão, você poderá convidar outro compositor para editar este rascunho em tempo real.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="join" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="session-token">Token da Sessão</Label>
              <Input
                id="session-token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="COLLAB-XXXXXXXXXXXX"
                className="font-mono"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Insira o token que você recebeu do compositor anfitrião para entrar na sessão.
            </p>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          {activeTab === 'create' && !generatedToken && (
            <Button 
              onClick={handleCreateSession} 
              disabled={isLoading || !draftId}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Users className="mr-2 h-4 w-4" />
                  Criar Sessão
                </>
              )}
            </Button>
          )}
          {activeTab === 'join' && (
            <Button 
              onClick={handleJoinSession} 
              disabled={isLoading || !token.trim()}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                <>
                  <Users className="mr-2 h-4 w-4" />
                  Entrar na Sessão
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
