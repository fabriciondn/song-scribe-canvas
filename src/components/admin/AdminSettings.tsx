import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Settings, Database, Mail, Shield, Users, Bell } from 'lucide-react';
import { useAdminSettings } from '@/hooks/useAdminSettings';

export const AdminSettings: React.FC = () => {
  const {
    settings,
    setSettings,
    isLoading,
    handleSaveSettings,
    handleBackupDatabase,
  } = useAdminSettings();

  const systemInfo = [
    { label: 'Versão da Plataforma', value: '1.0.0' },
    { label: 'Banco de Dados', value: 'Supabase PostgreSQL' },
    { label: 'Ambiente', value: 'Produção' },
    { label: 'Backup', value: 'Automático - Supabase' },
  ];

  return (
  <div className="space-y-4 md:space-y-6 px-1 md:px-0">
      {/* Configurações Gerais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurações Gerais
          </CardTitle>
          <CardDescription>
            Configure as definições básicas da plataforma
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="siteName">Nome da Plataforma</Label>
              <Input
                id="siteName"
                value={settings.siteName}
                onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="maxCredits">Créditos Máximos por Usuário</Label>
              <Input
                id="maxCredits"
                type="number"
                value={settings.maxCreditsPerUser}
                onChange={(e) => setSettings({ ...settings, maxCreditsPerUser: parseInt(e.target.value) })}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="siteDescription">Descrição da Plataforma</Label>
            <Textarea
              id="siteDescription"
              value={settings.siteDescription}
              onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Configurações de Recursos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Configurações de Recursos
          </CardTitle>
          <CardDescription>
            Ative ou desative funcionalidades da plataforma
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Permitir Novos Registros</Label>
              <p className="text-sm text-muted-foreground">
                Permite que novos usuários se registrem na plataforma
              </p>
            </div>
            <Switch
              checked={settings.enableRegistrations}
              onCheckedChange={(checked) => setSettings({ ...settings, enableRegistrations: checked })}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label>Ativar Parcerias</Label>
              <p className="text-sm text-muted-foreground">
                Permite criação e gerenciamento de parcerias colaborativas
              </p>
            </div>
            <Switch
              checked={settings.enablePartnerships}
              onCheckedChange={(checked) => setSettings({ ...settings, enablePartnerships: checked })}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label>Notificações por Email</Label>
              <p className="text-sm text-muted-foreground">
                Envia notificações importantes por email
              </p>
            </div>
            <Switch
              checked={settings.enableEmailNotifications}
              onCheckedChange={(checked) => setSettings({ ...settings, enableEmailNotifications: checked })}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label>Modo de Manutenção</Label>
              <p className="text-sm text-muted-foreground">
                Desativa temporariamente o acesso à plataforma
              </p>
            </div>
            <Switch
              checked={settings.maintenanceMode}
              onCheckedChange={(checked) => setSettings({ ...settings, maintenanceMode: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Configurações de Sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Configurações de Sistema
          </CardTitle>
          <CardDescription>
            Gerencie aspectos técnicos e de segurança
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="backupFrequency">Frequência de Backup</Label>
              <select
                className="w-full mt-1 p-2 border rounded-md"
                value={settings.backupFrequency}
                onChange={(e) => setSettings({ ...settings, backupFrequency: e.target.value })}
              >
                <option value="hourly">A cada hora</option>
                <option value="daily">Diário</option>
                <option value="weekly">Semanal</option>
              </select>
            </div>
            <div>
              <Label htmlFor="maxFileSize">Tamanho Máximo de Arquivo (MB)</Label>
              <Input
                id="maxFileSize"
                type="number"
                value={settings.maxFileSize}
                onChange={(e) => setSettings({ ...settings, maxFileSize: parseInt(e.target.value) })}
              />
            </div>
          </div>

          <div className="flex gap-4">
            <Button 
              onClick={handleBackupDatabase} 
              variant="outline"
              disabled={isLoading}
            >
              <Database className="h-4 w-4 mr-2" />
              {isLoading ? 'Processando...' : 'Fazer Backup Agora'}
            </Button>
            <Button 
              onClick={handleSaveSettings}
              disabled={isLoading}
            >
              {isLoading ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Informações do Sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Informações do Sistema
          </CardTitle>
          <CardDescription>
            Status e informações técnicas da plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {systemInfo.map((info, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-sm font-medium">{info.label}:</span>
                <Badge variant="secondary">{info.value}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};