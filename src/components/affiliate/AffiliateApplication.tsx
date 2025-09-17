import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Award, 
  CheckCircle,
  Star,
  Trophy
} from 'lucide-react';
import { applyForAffiliate } from '@/services/affiliateService';
import { useToast } from '@/hooks/use-toast';

interface AffiliateFormData {
  fullName: string;
  whatsapp: string;
  email: string;
  socialMediaLink: string;
  youtubeLink: string;
  tiktokLink: string;
  websiteLink: string;
  promotionStrategy: string;
}

export const AffiliateApplication = () => {
  const [showForm, setShowForm] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [formData, setFormData] = useState<AffiliateFormData>({
    fullName: '',
    whatsapp: '',
    email: '',
    socialMediaLink: '',
    youtubeLink: '',
    tiktokLink: '',
    websiteLink: '',
    promotionStrategy: ''
  });
  const { toast } = useToast();

  const handleInputChange = (field: keyof AffiliateFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações básicas
    if (!formData.fullName || !formData.whatsapp || !formData.email || !formData.promotionStrategy) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    setIsApplying(true);
    
    try {
      const result = await applyForAffiliate(formData);
      
      if (result.success) {
        toast({
          title: "Solicitação Enviada!",
          description: "Sua solicitação foi enviada com sucesso. Nossa equipe analisará e você será informado sobre a aprovação no seu WhatsApp ou email informado no formulário.",
        });
        
        // Recarregar a página para mostrar o status atualizado
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        toast({
          title: "Erro",
          description: result.error || "Erro ao enviar solicitação",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro ao enviar solicitação",
        description: "Ocorreu um erro ao enviar sua solicitação. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Hero Section */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold mb-4">
          Torne-se um Afiliado <span className="text-primary">Compuse</span>
        </h1>
        <p className="text-xl text-muted-foreground mb-6">
          Ganhe comissões indicando novos usuários para a plataforma
        </p>
        <div className="flex justify-center gap-2">
          <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
            Até 50% de comissão
          </Badge>
          <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
            Comissões recorrentes
          </Badge>
          <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-purple-200">
            Materiais de marketing
          </Badge>
        </div>
      </div>

      {/* Níveis de Afiliação */}
      <div className="grid md:grid-cols-3 gap-6 mb-10">
        <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100">
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <Star className="w-6 h-6 text-white" />
            </div>
            <CardTitle className="flex items-center justify-center gap-2">
              Nível Bronze
            </CardTitle>
            <CardDescription>Para iniciantes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-600" />
              25% comissão por registro autoral
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Link de afiliado personalizado
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Dashboard básico
            </div>
            <div className="text-center mt-4">
              <Badge variant="outline" className="border-orange-300 text-orange-700">
                0-4 registros
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-300 bg-gradient-to-br from-gray-50 to-gray-100 relative">
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <Badge className="bg-gray-600 text-white">Mais Popular</Badge>
          </div>
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-gray-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <CardTitle className="flex items-center justify-center gap-2">
              Nível Silver
            </CardTitle>
            <CardDescription>Para afiliados ativos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-600" />
              50% comissão por registro autoral
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Campanhas personalizadas
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Relatórios avançados
            </div>
            <div className="text-center mt-4">
              <Badge variant="outline" className="border-gray-400 text-gray-700">
                5+ registros
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-300 bg-gradient-to-br from-yellow-50 to-yellow-100">
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <Award className="w-6 h-6 text-white" />
            </div>
            <CardTitle className="flex items-center justify-center gap-2">
              Nível Gold
            </CardTitle>
            <CardDescription>Para super afiliados</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-600" />
              50% comissão por registro autoral
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-600" />
              25-50% comissão recorrente
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Suporte prioritário
            </div>
            <div className="text-center mt-4">
              <Badge variant="outline" className="border-yellow-400 text-yellow-700">
                100+ registros
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Como Funciona */}
      <Card className="mb-10">
        <CardHeader>
          <CardTitle className="text-center">Como Funciona o Sistema de Comissões</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Comissão por Registro Autoral
            </h3>
            <ul className="space-y-2 text-sm">
              <li>• <strong>Bronze:</strong> 25% sobre cada registro (R$ 12,50)</li>
              <li>• <strong>Silver/Gold:</strong> 50% sobre cada registro (R$ 25,00)</li>
              <li>• Comissão única por registro autoral</li>
              <li>• Upgrade automático após 5 registros</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              Comissão Recorrente (Gold)
            </h3>
            <ul className="space-y-2 text-sm">
              <li>• Disponível após 100 registros indicados</li>
              <li>• 25% dos primeiros 10 assinantes (R$ 3,75/mês)</li>
              <li>• 50% dos próximos assinantes (R$ 7,50/mês)</li>
              <li>• Comissão mensal enquanto o cliente for ativo</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid md:grid-cols-3 gap-6 mb-10">
        <div className="text-center">
          <div className="text-3xl font-bold text-primary mb-2">R$ 1.250</div>
          <p className="text-sm text-muted-foreground">Média mensal dos afiliados Gold</p>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-primary mb-2">4.7%</div>
          <p className="text-sm text-muted-foreground">Taxa média de conversão</p>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-primary mb-2">98%</div>
          <p className="text-sm text-muted-foreground">Satisfação dos afiliados</p>
        </div>
      </div>

      {/* CTA */}
      <Card className="bg-gradient-to-r from-primary to-primary/80 text-white border-none">
        <CardContent className="text-center p-8">
          <h2 className="text-2xl font-bold mb-4">
            Pronto para Começar?
          </h2>
          <p className="mb-6 opacity-90">
            Junte-se aos nossos afiliados e comece a ganhar comissões hoje mesmo
          </p>
          {!showForm ? (
            <Button 
              size="lg" 
              variant="secondary"
              onClick={() => setShowForm(true)}
              className="text-primary hover:bg-white/90"
            >
              Quero ser Afiliado
            </Button>
          ) : (
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle>Formulário de Inscrição - Programa de Afiliados</CardTitle>
                <CardDescription>
                  Preencha todos os dados para que possamos analisar sua candidatura
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fullName">Nome Completo *</Label>
                      <Input
                        id="fullName"
                        value={formData.fullName}
                        onChange={(e) => handleInputChange('fullName', e.target.value)}
                        placeholder="Seu nome completo"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="whatsapp">WhatsApp *</Label>
                      <Input
                        id="whatsapp"
                        value={formData.whatsapp}
                        onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                        placeholder="+55 11 99999-9999"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="seu@email.com"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="socialMediaLink">Instagram/Facebook</Label>
                      <Input
                        id="socialMediaLink"
                        value={formData.socialMediaLink}
                        onChange={(e) => handleInputChange('socialMediaLink', e.target.value)}
                        placeholder="Link do seu perfil"
                      />
                    </div>
                    <div>
                      <Label htmlFor="youtubeLink">YouTube</Label>
                      <Input
                        id="youtubeLink"
                        value={formData.youtubeLink}
                        onChange={(e) => handleInputChange('youtubeLink', e.target.value)}
                        placeholder="Link do seu canal"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="tiktokLink">TikTok</Label>
                      <Input
                        id="tiktokLink"
                        value={formData.tiktokLink}
                        onChange={(e) => handleInputChange('tiktokLink', e.target.value)}
                        placeholder="Link do seu perfil"
                      />
                    </div>
                    <div>
                      <Label htmlFor="websiteLink">Site</Label>
                      <Input
                        id="websiteLink"
                        value={formData.websiteLink}
                        onChange={(e) => handleInputChange('websiteLink', e.target.value)}
                        placeholder="Seu site ou blog"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="promotionStrategy">Como pretende divulgar? *</Label>
                    <Textarea
                      id="promotionStrategy"
                      value={formData.promotionStrategy}
                      onChange={(e) => handleInputChange('promotionStrategy', e.target.value)}
                      placeholder="Descreva como planeja promover o CompuSe e atrair novos usuários..."
                      rows={4}
                      required
                    />
                  </div>

                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowForm(false)}
                      className="flex-1"
                    >
                      Voltar
                    </Button>
                    <Button 
                      type="submit"
                      disabled={isApplying}
                      className="flex-1"
                    >
                      {isApplying ? 'Enviando...' : 'Enviar Solicitação'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
          <p className="text-xs mt-4 opacity-75">
            Análise em até 3 dias úteis
          </p>
        </CardContent>
      </Card>
    </div>
  );
};