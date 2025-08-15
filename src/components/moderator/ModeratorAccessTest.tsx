import { useAuth } from '@/hooks/useAuth';
import { useImpersonation } from '@/context/ImpersonationContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const ModeratorAccessTest = () => {
  const auth = useAuth();
  const impersonation = useImpersonation();

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Status de Acesso - Debug</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold">Estado da Autenticação:</h3>
          <div className="space-y-2">
            <div>ID do usuário: <Badge variant="outline">{auth.user?.id || 'N/A'}</Badge></div>
            <div>Email: <Badge variant="outline">{auth.user?.email || 'N/A'}</Badge></div>
            <div>Autenticado: <Badge variant={auth.isAuthenticated ? 'default' : 'destructive'}>
              {auth.isAuthenticated ? 'Sim' : 'Não'}
            </Badge></div>
          </div>
        </div>

        <div>
          <h3 className="font-semibold">Estado da Impersonação:</h3>
          <div className="space-y-2">
            <div>Impersonando: <Badge variant={impersonation.isImpersonating ? 'default' : 'secondary'}>
              {impersonation.isImpersonating ? 'Sim' : 'Não'}
            </Badge></div>
            {impersonation.isImpersonating && (
              <>
                <div>Usuário impersonado: <Badge variant="outline">
                  {impersonation.impersonatedUser?.name || 'N/A'}
                </Badge></div>
                <div>Email impersonado: <Badge variant="outline">
                  {impersonation.impersonatedUser?.email || 'N/A'}
                </Badge></div>
                <div>ID impersonado: <Badge variant="outline">
                  {impersonation.impersonatedUser?.id || 'N/A'}
                </Badge></div>
              </>
            )}
            {impersonation.originalUser && (
              <div>Usuário original: <Badge variant="outline">
                {impersonation.originalUser.name || 'N/A'}
              </Badge></div>
            )}
          </div>
        </div>

        <div>
          <h3 className="font-semibold">Permissões:</h3>
          <div className="space-y-2">
            <div>Pode impersonar usuário: <Badge variant={impersonation.canImpersonate('user') ? 'default' : 'secondary'}>
              {impersonation.canImpersonate('user') ? 'Sim' : 'Não'}
            </Badge></div>
            <div>Pode impersonar moderador: <Badge variant={impersonation.canImpersonate('moderator') ? 'default' : 'secondary'}>
              {impersonation.canImpersonate('moderator') ? 'Sim' : 'Não'}
            </Badge></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};