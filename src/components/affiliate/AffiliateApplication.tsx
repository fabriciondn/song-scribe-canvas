import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

export const AffiliateApplication = () => {
  const [isApplying, setIsApplying] = useState(false);
  const { toast } = useToast();

  const handleApply = async () => {
    setIsApplying(true);
    try {
      const result = await applyForAffiliate();
      
      if (result.success) {
        toast({
          title: "Solicitação Enviada!",
          description: "Sua solicitação para se tornar afiliado foi enviada com sucesso.",
        });
        // Recarregar a página para mostrar o status pendente
        window.location.reload();
      } else {
        toast({
          title: "Erro",
          description: result.error || "Erro ao enviar solicitação",
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
          <Button 
            size="lg" 
            variant="secondary"
            onClick={handleApply}
            disabled={isApplying}
            className="text-primary hover:bg-white/90"
          >
            {isApplying ? 'Enviando...' : 'Quero ser Afiliado'}
          </Button>
          <p className="text-xs mt-4 opacity-75">
            Análise em até 3 dias úteis
          </p>
        </CardContent>
      </Card>
    </div>
  );
};