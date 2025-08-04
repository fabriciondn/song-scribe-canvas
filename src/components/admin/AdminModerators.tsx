import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Copy, Plus, Clock, CheckCircle, X } from 'lucide-react';
import { toast } from 'sonner';
import { 
  generateModeratorRegistrationToken, 
  generateModeratorRegistrationUrl,
  listModeratorRegistrationTokens 
} from '@/services/moderatorTokenService';

export const AdminModerators = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [daysValid, setDaysValid] = useState(7);
  const [generatedUrl, setGeneratedUrl] = useState<string>('');

  const queryClient = useQueryClient();

  const { data: tokens = [], isLoading } = useQuery({
    queryKey: ['moderator-registration-tokens'],
    queryFn: listModeratorRegistrationTokens,
  });

  const generateTokenMutation = useMutation({
    mutationFn: (days: number) => generateModeratorRegistrationToken(days),
    onSuccess: (token) => {
      const url = generateModeratorRegistrationUrl(token);
      setGeneratedUrl(url);
      toast.success('Token de cadastro gerado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['moderator-registration-tokens'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao gerar token');
    },
  });

  const handleGenerateToken = () => {
    generateTokenMutation.mutate(daysValid);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Link copiado para a área de transferência!');
    } catch (error) {
      toast.error('Erro ao copiar link');
    }
  };

  const isTokenExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getTokenStatus = (token: any) => {
    if (token.used) {
      return (
        <Badge variant="secondary" className="flex items-center space-x-1">
          <CheckCircle className="h-3 w-3" />
          <span>Usado</span>
        </Badge>
      );
    }
    
    if (isTokenExpired(token.expires_at)) {
      return (
        <Badge variant="destructive" className="flex items-center space-x-1">
          <X className="h-3 w-3" />
          <span>Expirado</span>
        </Badge>
      );
    }
    
    return (
      <Badge variant="default" className="flex items-center space-x-1">
        <Clock className="h-3 w-3" />
        <span>Ativo</span>
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gestão de Moderadores</h2>
          <p className="text-muted-foreground">
            Gere links de cadastro para novos moderadores
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Gerar Link de Cadastro
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Gerar Token de Cadastro para Moderador</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="daysValid">Validade (dias)</Label>
                <Input
                  id="daysValid"
                  type="number"
                  min="1"
                  max="30"
                  value={daysValid}
                  onChange={(e) => setDaysValid(Number(e.target.value))}
                  placeholder="Número de dias"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  O token expirará em {daysValid} dias
                </p>
              </div>

              {generatedUrl && (
                <div className="space-y-2">
                  <Label>Link de Cadastro Gerado</Label>
                  <div className="flex space-x-2">
                    <Input
                      value={generatedUrl}
                      readOnly
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(generatedUrl)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Envie este link para o futuro moderador se cadastrar
                  </p>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    setGeneratedUrl('');
                  }}
                >
                  {generatedUrl ? 'Fechar' : 'Cancelar'}
                </Button>
                {!generatedUrl && (
                  <Button
                    onClick={handleGenerateToken}
                    disabled={generateTokenMutation.isPending}
                  >
                    {generateTokenMutation.isPending ? 'Gerando...' : 'Gerar Token'}
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tokens de Cadastro</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-6">Carregando tokens...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Token</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead>Expira em</TableHead>
                  <TableHead>Usado por</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tokens.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6">
                      Nenhum token gerado ainda
                    </TableCell>
                  </TableRow>
                ) : (
                  tokens.map((token) => (
                    <TableRow key={token.id}>
                      <TableCell className="font-mono text-sm">
                        {token.token.substring(0, 8)}...
                      </TableCell>
                      <TableCell>
                        {getTokenStatus(token)}
                      </TableCell>
                      <TableCell>
                        {formatDate(token.created_at)}
                      </TableCell>
                      <TableCell>
                        {formatDate(token.expires_at)}
                      </TableCell>
                      <TableCell>
                        {token.used_by ? (
                          <Badge variant="outline">
                            {token.used_by.substring(0, 8)}...
                          </Badge>
                        ) : (
                          'Não usado'
                        )}
                      </TableCell>
                      <TableCell>
                        {!token.used && !isTokenExpired(token.expires_at) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(generateModeratorRegistrationUrl(token.token))}
                          >
                            <Copy className="h-4 w-4 mr-1" />
                            Copiar Link
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};