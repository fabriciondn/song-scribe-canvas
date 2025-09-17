import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  BarChart3, 
  MousePointer, 
  Target,
  Calendar,
  Settings,
  TrendingUp,
  Copy
} from 'lucide-react';
import { useAffiliate } from '@/hooks/useAffiliate';
import { createAffiliateCampaign, generateAffiliateLink } from '@/services/affiliateService';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export const AffiliateCampaigns = () => {
  const { affiliate, campaigns, refreshData } = useAffiliate();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    utm_source: '',
    utm_medium: '',
    utm_campaign: '',
    utm_content: '',
    is_active: true
  });

  const handleCreateCampaign = async () => {
    setIsCreating(true);
    try {
      const result = await createAffiliateCampaign(formData);
      
      if (result.success) {
        toast({
          title: "Campanha Criada!",
          description: "Sua nova campanha foi criada com sucesso.",
        });
        setFormData({
          name: '',
          description: '',
          utm_source: '',
          utm_medium: '',
          utm_campaign: '',
          utm_content: '',
          is_active: true
        });
        setShowCreateDialog(false);
        refreshData();
      } else {
        toast({
          title: "Erro",
          description: result.error || "Erro ao criar campanha",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro interno do servidor",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const generateCampaignLink = (campaign: any) => {
    const utmParams = new URLSearchParams();
    if (campaign.utm_source) utmParams.append('utm_source', campaign.utm_source);
    if (campaign.utm_medium) utmParams.append('utm_medium', campaign.utm_medium);
    if (campaign.utm_campaign) utmParams.append('utm_campaign', campaign.utm_campaign);
    if (campaign.utm_content) utmParams.append('utm_content', campaign.utm_content);
    
    const baseUrl = generateAffiliateLink(affiliate?.affiliate_code || '');
    return utmParams.toString() ? `${baseUrl}?${utmParams.toString()}` : baseUrl;
  };

  const copyLink = (campaign: any) => {
    const link = generateCampaignLink(campaign);
    navigator.clipboard.writeText(link);
    toast({
      title: "Link Copiado!",
      description: "Link da campanha copiado para a área de transferência",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header com Botão de Criar */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Suas Campanhas</h2>
          <p className="text-muted-foreground">
            Gerencie e monitore suas campanhas de marketing
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nova Campanha
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Criar Nova Campanha</DialogTitle>
              <DialogDescription>
                Configure os parâmetros da sua campanha para rastrear o desempenho
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Campanha *</Label>
                  <Input
                    id="name"
                    placeholder="ex: Instagram Stories Dezembro"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="utm_source">UTM Source</Label>
                  <Input
                    id="utm_source"
                    placeholder="ex: instagram"
                    value={formData.utm_source}
                    onChange={(e) => setFormData({...formData, utm_source: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="utm_medium">UTM Medium</Label>
                  <Input
                    id="utm_medium"
                    placeholder="ex: social"
                    value={formData.utm_medium}
                    onChange={(e) => setFormData({...formData, utm_medium: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="utm_campaign">UTM Campaign</Label>
                  <Input
                    id="utm_campaign"
                    placeholder="ex: dezembro2024"
                    value={formData.utm_campaign}
                    onChange={(e) => setFormData({...formData, utm_campaign: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="utm_content">UTM Content</Label>
                <Input
                  id="utm_content"
                  placeholder="ex: stories-azul"
                  value={formData.utm_content}
                  onChange={(e) => setFormData({...formData, utm_content: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  placeholder="Descreva o objetivo desta campanha..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateCampaign}
                disabled={!formData.name || isCreating}
              >
                {isCreating ? 'Criando...' : 'Criar Campanha'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de Campanhas */}
      {campaigns.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma campanha criada</h3>
            <p className="text-muted-foreground mb-4">
              Crie sua primeira campanha para rastrear o desempenho dos seus links
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeira Campanha
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {campaigns.map((campaign) => (
            <Card key={campaign.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {campaign.name}
                      <Badge variant={campaign.is_active ? "default" : "secondary"}>
                        {campaign.is_active ? "Ativa" : "Inativa"}
                      </Badge>
                    </CardTitle>
                    {campaign.description && (
                      <CardDescription>{campaign.description}</CardDescription>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyLink(campaign)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <MousePointer className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <div className="text-2xl font-bold">{campaign.total_clicks}</div>
                      <div className="text-xs text-muted-foreground">Cliques</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <div className="text-2xl font-bold">{campaign.total_conversions}</div>
                      <div className="text-xs text-muted-foreground">Conversões</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <div className="text-2xl font-bold">
                        {campaign.total_clicks > 0 
                          ? ((campaign.total_conversions / campaign.total_clicks) * 100).toFixed(1)
                          : 0
                        }%
                      </div>
                      <div className="text-xs text-muted-foreground">Taxa de Conversão</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">
                        {new Date(campaign.created_at).toLocaleDateString('pt-BR')}
                      </div>
                      <div className="text-xs text-muted-foreground">Criada em</div>
                    </div>
                  </div>
                </div>

                {/* UTM Parameters */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold mb-2">Parâmetros UTM</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Source:</span>
                      <div className="font-mono">{campaign.utm_source || '-'}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Medium:</span>
                      <div className="font-mono">{campaign.utm_medium || '-'}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Campaign:</span>
                      <div className="font-mono">{campaign.utm_campaign || '-'}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Content:</span>
                      <div className="font-mono">{campaign.utm_content || '-'}</div>
                    </div>
                  </div>
                </div>

                {/* Link da Campanha */}
                <div className="border-t pt-4 mt-4">
                  <div className="flex items-center gap-2 p-2 bg-muted rounded text-sm">
                    <span className="text-muted-foreground">Link:</span>
                    <code className="flex-1">{generateCampaignLink(campaign)}</code>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};