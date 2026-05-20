import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Key, Save, Loader2, Info } from 'lucide-react';
import { useApiSettings } from '@/hooks/useApiSettings';
import { useToast } from '@/hooks/use-toast';

export const AdminApiSettings: React.FC = () => {
  const { settings, isLoading, updateSetting } = useApiSettings();
  const [localValues, setLocalValues] = React.useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = React.useState<string | null>(null);
  const { toast } = useToast();

  React.useEffect(() => {
    if (settings.length > 0) {
      const values: Record<string, string> = {};
      settings.forEach(s => {
        values[s.key] = s.value;
      });
      setLocalValues(values);
    }
  }, [settings]);

  const handleSave = async (key: string) => {
    setIsSaving(key);
    const success = await updateSetting(key, localValues[key] || '');
    if (success) {
      toast({
        title: 'Configuração salva',
        description: `A chave ${key} foi atualizada com sucesso.`,
      });
    }
    setIsSaving(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Key className="h-6 w-6 text-primary" />
            Tokens e APIs
          </CardTitle>
          <CardDescription>
            Configure as credenciais da OpenPix (AppID) e outras chaves de integração.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted/30 border border-muted p-4 rounded-lg flex gap-3 items-start">
            <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
            <div className="text-sm space-y-1">
              <p className="font-medium">Segurança das Credenciais</p>
              <p className="text-muted-foreground">
                As chaves configuradas aqui são armazenadas de forma segura e utilizadas pelas Edge Functions do sistema para processar pagamentos e outras integrações.
              </p>
            </div>
          </div>

          <div className="grid gap-6">
            {settings.map((setting) => (
              <div key={setting.key} className="space-y-2 pb-4 border-b last:border-0">
                <div className="flex items-center justify-between">
                  <Label htmlFor={setting.key} className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                    {setting.key.replace(/_/g, ' ')}
                  </Label>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="h-8 gap-2 hover:bg-primary hover:text-primary-foreground"
                    onClick={() => handleSave(setting.key)}
                    disabled={isSaving === setting.key}
                  >
                    {isSaving === setting.key ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Save className="h-3 w-3" />
                    )}
                    Salvar
                  </Button>
                </div>
                <Input
                  id={setting.key}
                  type={setting.key.toLowerCase().includes('secret') || setting.key.toLowerCase().includes('key') ? 'password' : 'text'}
                  value={localValues[setting.key] || ''}
                  onChange={(e) => setLocalValues(prev => ({ ...prev, [setting.key]: e.target.value }))}
                  placeholder={`Insira o valor para ${setting.key}`}
                  className="bg-background/50"
                />
                <p className="text-xs text-muted-foreground">
                  {setting.description}
                </p>
              </div>
            ))}

            {settings.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma configuração de API encontrada no banco de dados.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg">Instruções OpenPix</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-3">
          <p>Para configurar a OpenPix, você precisará de:</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li><strong>OPENPIX_APP_ID:</strong> O AppID gerado no painel da OpenPix em API/Plugins &gt; Nova Chave.</li>
            <li><strong>OPENPIX_WEBHOOK_SECRET:</strong> O segredo configurado no Webhook para validar as notificações (opcional, mas recomendado).</li>
          </ul>
          <p className="pt-2">A URL de Webhook para configurar na OpenPix é:</p>
          <code className="block p-2 bg-muted rounded border text-xs break-all">
            {window.location.origin.replace('lovable.app', 'supabase.co')}/functions/v1/openpix-webhook
          </code>
        </CardContent>
      </Card>
    </div>
  );
};
