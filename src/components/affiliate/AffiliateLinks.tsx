import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Copy, 
  Link, 
  QrCode, 
  Share2, 
  Download,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { generateAffiliateLink } from '@/services/affiliateService';
import { useToast } from '@/hooks/use-toast';

interface AffiliateLinksProps {
  affiliateCode: string;
}

export const AffiliateLinks = ({ affiliateCode }: AffiliateLinksProps) => {
  const [campaignName, setCampaignName] = useState('');
  const [customLink, setCustomLink] = useState('');
  const { toast } = useToast();

  const baseLink = generateAffiliateLink(affiliateCode);
  const campaignLink = campaignName ? generateAffiliateLink(affiliateCode, campaignName) : baseLink;

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: `${type} copiado para a área de transferência`,
    });
  };

  const shareLink = async (link: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Compuse - Plataforma de Música',
          text: 'Conheça a melhor plataforma para compositores e músicos!',
          url: link
        });
      } catch (error) {
        copyToClipboard(link, 'Link');
      }
    } else {
      copyToClipboard(link, 'Link');
    }
  };

  const generateQRCode = (link: string) => {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(link)}`;
    window.open(qrUrl, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Link Principal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="w-5 h-5" />
            Seu Link Principal
          </CardTitle>
          <CardDescription>
            Use este link para compartilhar e ganhar comissões
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <Input 
              value={baseLink} 
              readOnly 
              className="bg-transparent border-none flex-1" 
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(baseLink, 'Link principal')}
            >
              <Copy className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => shareLink(baseLink)}
            >
              <Share2 className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => generateQRCode(baseLink)}
            >
              <QrCode className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Gerador de Links de Campanha */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Criar Link de Campanha
          </CardTitle>
          <CardDescription>
            Crie links personalizados para rastrear o desempenho de diferentes campanhas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="campaign">Nome da Campanha</Label>
              <Input
                id="campaign"
                placeholder="ex: instagram-stories"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Link Gerado</Label>
              <div className="flex items-center gap-2">
                <Input 
                  value={campaignLink} 
                  readOnly 
                  className="bg-muted" 
                />
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!campaignName}
                  onClick={() => copyToClipboard(campaignLink, 'Link da campanha')}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Materiais de Marketing */}
      <Card>
        <CardHeader>
          <CardTitle>Materiais de Marketing</CardTitle>
          <CardDescription>
            Textos e imagens prontos para suas campanhas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Textos Prontos */}
          <div className="space-y-4">
            <h4 className="font-semibold">Textos para Redes Sociais</h4>
            
            <div className="space-y-3">
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="secondary">Instagram/Facebook</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(
                      `🎵 Descobri a plataforma PERFEITA para compositores! \n\n✅ Registro de obras autorais\n✅ Ferramentas de composição\n✅ Proteção legal\n✅ Interface super intuitiva\n\nConheça: ${baseLink}\n\n#musica #compositor #direitosautorais #compuse`,
                      'Texto do Instagram'
                    )}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <Textarea 
                  value={`🎵 Descobri a plataforma PERFEITA para compositores! 

✅ Registro de obras autorais
✅ Ferramentas de composição  
✅ Proteção legal
✅ Interface super intuitiva

Conheça: ${baseLink}

#musica #compositor #direitosautorais #compuse`}
                  readOnly
                  className="bg-transparent border-none resize-none h-32"
                />
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="secondary">WhatsApp</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(
                      `Oi! Você que faz música precisa conhecer essa plataforma: ${baseLink}\n\nÉ ideal para registrar suas obras e proteger seus direitos autorais. Super recomendo! 🎵`,
                      'Texto do WhatsApp'
                    )}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <Textarea 
                  value={`Oi! Você que faz música precisa conhecer essa plataforma: ${baseLink}

É ideal para registrar suas obras e proteger seus direitos autorais. Super recomendo! 🎵`}
                  readOnly
                  className="bg-transparent border-none resize-none h-20"
                />
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="secondary">YouTube/Blog</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(
                      `Compuse é a plataforma completa para compositores e músicos que querem proteger suas criações. Com ferramentas profissionais para registro autoral, composição colaborativa e muito mais. Comece agora: ${baseLink}`,
                      'Texto para YouTube'
                    )}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <Textarea 
                  value={`Compuse é a plataforma completa para compositores e músicos que querem proteger suas criações. Com ferramentas profissionais para registro autoral, composição colaborativa e muito mais. Comece agora: ${baseLink}`}
                  readOnly
                  className="bg-transparent border-none resize-none h-20"
                />
              </div>
            </div>
          </div>

          {/* Banners */}
          <div className="space-y-4">
            <h4 className="font-semibold">Banners e Imagens</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border border-dashed border-muted-foreground/25 rounded-lg text-center">
                <div className="w-full h-32 bg-gradient-to-r from-primary/20 to-primary/40 rounded mb-3 flex items-center justify-center">
                  <span className="text-sm text-muted-foreground">Banner 728x90</span>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Baixar PNG
                </Button>
              </div>
              
              <div className="p-4 border border-dashed border-muted-foreground/25 rounded-lg text-center">
                <div className="w-full h-32 bg-gradient-to-r from-secondary/20 to-secondary/40 rounded mb-3 flex items-center justify-center">
                  <span className="text-sm text-muted-foreground">Banner 300x250</span>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Baixar PNG
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dicas de Marketing */}
      <Card>
        <CardHeader>
          <CardTitle>Dicas para Aumentar suas Conversões</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-green-700">✅ Faça</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Compartilhe em grupos de músicos</li>
                <li>• Use stories e reels no Instagram</li>
                <li>• Crie conteúdo sobre direitos autorais</li>
                <li>• Teste diferentes textos e imagens</li>
                <li>• Monitore suas métricas regularmente</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-red-700">❌ Evite</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Spam em grupos ou comentários</li>
                <li>• Promessas exageradas</li>
                <li>• Usar apenas o link, sem contexto</li>
                <li>• Focar só no dinheiro</li>
                <li>• Desistir após poucos dias</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};