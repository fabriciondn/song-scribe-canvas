import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Play, MessageCircle, Heart, Share2, Clock, Eye, Search, Video, Copyright, Handshake, DollarSign, ShieldCheck } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { ProOnlyWrapper } from '@/components/layout/ProOnlyWrapper';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileBottomNavigation } from '@/components/mobile/MobileBottomNavigation';
import { cn } from '@/lib/utils';

interface Tutorial {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: string;
  views: number;
  category: string;
  videoUrl: string;
  level?: string;
}

interface Comment {
  id: string;
  author: string;
  avatar: string;
  content: string;
  timestamp: string;
  type: 'suggestion' | 'doubt';
}

// Guide icon mapping using Lucide icons
const GuideIconMap: Record<string, React.ReactNode> = {
  'copyright': <Copyright className="w-5 h-5" />,
  'handshake': <Handshake className="w-5 h-5" />,
  'monetization_on': <DollarSign className="w-5 h-5" />,
  'verified_user': <ShieldCheck className="w-5 h-5" />,
};

// Static guides data
const STATIC_GUIDES = [
  { id: '1', title: 'Entendendo Royalties', description: 'Direitos autorais explicados.', icon: 'copyright' },
  { id: '2', title: 'Colaboração Segura', description: 'Contratos e splits.', icon: 'handshake' },
  { id: '3', title: 'Monetização', description: 'Spotify, Apple Music e mais.', icon: 'monetization_on' },
  { id: '4', title: 'Proteção Legal', description: 'Evite plágios.', icon: 'verified_user' },
];

// Static tutorials for mobile with exact images from HTML
const STATIC_MOBILE_TUTORIALS: Tutorial[] = [
  {
    id: 'featured-1',
    title: 'Como registrar sua primeira obra',
    description: 'Aprenda passo a passo como registrar sua primeira composição.',
    thumbnail: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAAXVS4OFMWWA5Z9IOa4VgJlpc7x8PqeIOHK_jB6_d15OaD2FXLYLyzZqBR0-LA5X6kJcB3Dl7yPPTq1FXp_VrrDJ8SLqwm5jOgOOE1LD2mozJNddRFghoglOMbDUzvyaSGv1rKBANbENcs-33JC3RFQieupLoGFvsejKy-tahjxPEyIyIp7O8Pun-qE60gZtPiKupAawOFgMs4Tva7JUIpKLvZT8fZnVDtV_VLM3BVJetwY-I1gisA023mymjfoLAoOn91HG2dX0U',
    duration: '5 min',
    views: 1500,
    category: 'Vídeo',
    videoUrl: '',
    level: 'Iniciante'
  },
  {
    id: 'prod-1',
    title: 'Masterização no Mobile',
    description: 'Descubra as técnicas essenciais para masterizar suas faixas usando apenas o celular.',
    thumbnail: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAMvy2Nr8_zLfkFNei9hsWwALaEeKS0wzG3JsXQAYH39D34HcgK1DRoLgfQvAxTvS_WEjVkf_T3AlsYTUOg_d-DC_8SePoT3AX5S0gaCoUagfRgAO7H9a5a8DSJUdyARrp2gexbFEOtnLfc-Ul_kAUL2yc3N_cVWT0YTeeJXevyArntRMHwqZoGKk-02ug_EdwjvWu-0Id0YJGZbLSml3WwEXIaRpkzIBJcShgCPsifORm-OwdLv-EkDUs_JCXZg8tHwP-JC3XXKVA',
    duration: '12:40',
    views: 2300,
    category: 'Áudio',
    videoUrl: '',
    level: 'Iniciante'
  },
  {
    id: 'prod-2',
    title: 'Sampling Criativo',
    description: 'Como transformar sons do dia a dia em instrumentos únicos para suas batidas.',
    thumbnail: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDLe3va95J41GBVRkbSTd2zMBYP4HcOjc5UYzg1cG1EulsDpezIqFd0BLbJ1kLU1jqRyz9Tiudb3ZmS1g2HaYmMJcpD4_JeQO_dj4o4v1dQWXFYuyEGtMMAXg-A23ifJLQ0MYsXxHzDwFca2Rsbfs3hoCnAS2TZjLbuNy09JKe3c_A39-_wXGT-GvTalOUc6Gcgkc6TF6RLlEcLs0WEPHQvEbAYrK07-6o8yQ4KkLyiZnQ6lbZeESQaEpjhiHrmyg9paxnID7lvrmk',
    duration: '08:15',
    views: 1800,
    category: 'Criação',
    videoUrl: '',
    level: 'Intermediário'
  }
];

const mockComments: Comment[] = [
  {
    id: '1',
    author: 'João Silva',
    avatar: '',
    content: 'Seria interessante ter um tutorial específico sobre progressões harmônicas no sertanejo.',
    timestamp: '2 horas atrás',
    type: 'suggestion'
  },
  {
    id: '2',
    author: 'Maria Santos',
    avatar: '',
    content: 'Como posso aplicar essas técnicas em músicas populares brasileiras?',
    timestamp: '5 horas atrás',
    type: 'doubt'
  }
];

export const Tutorials: React.FC = () => {
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<Comment[]>(mockComments);
  const [newComment, setNewComment] = useState('');
  const [commentType, setCommentType] = useState<'suggestion' | 'doubt'>('suggestion');
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const mobileCategories = ['Todos', 'Vídeos', 'Guias', 'Direitos'];
  const desktopCategories = ['Todos', 'Composição', 'Harmonia', 'Melodia', 'Produção', 'Letra', 'Colaboração'];
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  const fetchTutorials = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tutorials')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true });
      
      if (error) throw error;
      
      const formattedTutorials = data.map(tutorial => ({
        id: tutorial.id,
        title: tutorial.title,
        description: tutorial.description || '',
        thumbnail: tutorial.thumbnail_url || '/lovable-uploads/913b0b45-af0f-4a18-9433-06da553e8273.png',
        duration: '15:30',
        views: Math.floor(Math.random() * 2000) + 100,
        category: tutorial.category || 'Vídeos',
        videoUrl: tutorial.video_url
      }));
      
      setTutorials(formattedTutorials);
    } catch (error) {
      console.error('Erro ao buscar tutoriais:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os tutoriais.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTutorials();
  }, []);

  const filteredTutorials = selectedCategory === 'Todos' 
    ? tutorials 
    : tutorials.filter(tutorial => tutorial.category === selectedCategory);

  const handleWatchTutorial = (tutorial: Tutorial) => {
    setSelectedTutorial(tutorial);
  };

  const handleSubmitComment = () => {
    if (!newComment.trim()) return;

    const comment: Comment = {
      id: Date.now().toString(),
      author: 'Você',
      avatar: '',
      content: newComment,
      timestamp: 'agora',
      type: commentType
    };

    setComments([comment, ...comments]);
    setNewComment('');
    toast({
      title: commentType === 'suggestion' ? 'Sugestão enviada!' : 'Dúvida enviada!',
      description: 'Obrigado pelo seu feedback. Nossa equipe irá analisar em breve.',
    });
  };

  // Mobile Loading State
  if (loading && isMobile) {
    return (
      <div className="min-h-screen bg-black flex flex-col">
        <div className="sticky top-0 z-40 bg-black/90 backdrop-blur-md">
          <div className="flex items-center justify-between p-4 pb-2">
            <Skeleton className="h-8 w-32 bg-white/10" />
            <Skeleton className="h-10 w-10 rounded-full bg-white/10" />
          </div>
          <div className="flex gap-3 px-4 pb-4 overflow-x-auto">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-9 w-20 rounded-full flex-shrink-0 bg-white/10" />
            ))}
          </div>
        </div>
        <div className="flex-1 px-4 space-y-6 pb-24">
          <Skeleton className="h-64 w-full rounded-3xl bg-white/10" />
          <div className="space-y-4">
            <Skeleton className="h-48 w-full rounded-3xl bg-white/10" />
            <Skeleton className="h-48 w-full rounded-3xl bg-white/10" />
          </div>
        </div>
        <MobileBottomNavigation />
      </div>
    );
  }

  // Mobile Layout - Exact match to HTML
  if (isMobile) {
    const displayTutorials = STATIC_MOBILE_TUTORIALS;
    const featuredTutorial = displayTutorials[0];
    const productionTutorials = displayTutorials.slice(1);

    return (
      <div className="min-h-screen bg-black text-white pb-8">
        {/* Sticky Header */}
        <div className="sticky top-0 z-40 bg-black/90 backdrop-blur-md transition-all duration-300">
          <div className="flex items-center justify-between p-4 pb-2">
            <h1 className="text-2xl font-bold leading-tight tracking-tight">Tutoriais</h1>
            <button className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/10 transition-colors">
              <Search className="w-6 h-6" />
            </button>
          </div>
          
          {/* Category Filters - Exact match */}
          <div 
            className="flex gap-3 px-4 pb-4 overflow-x-auto"
            style={{ 
              scrollbarWidth: 'none', 
              msOverflowStyle: 'none',
              maskImage: 'linear-gradient(to right, black 85%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to right, black 85%, transparent 100%)'
            }}
          >
            {mobileCategories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  "flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full px-5 transition-all active:scale-95",
                  selectedCategory === category
                    ? "bg-[#1ed760] shadow-[0_0_10px_rgba(30,215,96,0.3)]"
                    : "bg-white/10 border border-white/5 hover:bg-white/20"
                )}
              >
                <span className={cn(
                  "text-sm font-medium",
                  selectedCategory === category ? "text-black font-bold" : "text-slate-200"
                )}>
                  {category}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-col gap-6 w-full max-w-md mx-auto">
          {/* Featured Section - Destaque */}
          <div>
            <div className="px-4 pb-3 pt-2 flex items-center justify-between">
              <h3 className="text-lg font-bold leading-tight">Destaque</h3>
            </div>
            <div className="px-4">
              <div 
                className="relative group cursor-pointer overflow-hidden rounded-[1.5rem] bg-[#121212] shadow-lg border border-white/5"
                onClick={() => handleWatchTutorial(featuredTutorial)}
              >
                <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                <div 
                  className="w-full aspect-[4/3] bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                  style={{ backgroundImage: `url("${featuredTutorial.thumbnail}")` }}
                />
                <div className="absolute inset-0 z-20 flex items-center justify-center opacity-90 group-hover:opacity-100 transition-opacity">
                  <div className="w-14 h-14 rounded-full bg-[#1ed760]/90 backdrop-blur-sm flex items-center justify-center shadow-[0_0_20px_rgba(30,215,96,0.5)]">
                    <Play className="w-8 h-8 text-black fill-current" />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 z-20 p-5 flex flex-col gap-1">
                  <div className="inline-flex self-start items-center px-2 py-0.5 rounded bg-[#1ed760]/90 backdrop-blur-sm text-[10px] font-bold uppercase tracking-wider text-black mb-1">
                    Novo
                  </div>
                  <h2 className="text-white text-xl font-bold leading-tight">{featuredTutorial.title}</h2>
                  <div className="flex items-center gap-2 text-slate-300 text-sm font-medium mt-1">
                    <span className="flex items-center gap-1">
                      <Video className="w-4 h-4 text-[#1ed760]" />
                      Vídeo
                    </span>
                    <span>•</span>
                    <span>{featuredTutorial.duration}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Learn Production Section - Aprenda Produção */}
          <div>
            <div className="px-4 pb-2 pt-2 flex items-center justify-between">
              <h3 className="text-lg font-bold leading-tight">Aprenda Produção</h3>
              <a className="text-[#1ed760] text-sm font-semibold hover:text-[#1ed760]/80" href="#">Ver tudo</a>
            </div>
            <div className="flex flex-col gap-4 px-4">
              {productionTutorials.map((tutorial) => (
                <div 
                  key={tutorial.id}
                  className="flex flex-col bg-[#121212] rounded-[1.5rem] p-3 shadow-sm hover:bg-[#1a1a1a] transition-colors cursor-pointer group border border-white/5"
                  onClick={() => handleWatchTutorial(tutorial)}
                >
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden mb-3">
                    <div 
                      className="w-full h-full bg-cover bg-center"
                      style={{ backgroundImage: `url("${tutorial.thumbnail}")` }}
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                    <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-md px-1.5 py-0.5 rounded text-xs font-medium text-white">
                      {tutorial.duration}
                    </div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="w-5 h-5 text-white fill-current" />
                    </div>
                  </div>
                  <div className="px-1 pb-1">
                    <h4 className="text-base font-bold leading-tight text-white mb-1 group-hover:text-[#1ed760] transition-colors">
                      {tutorial.title}
                    </h4>
                    <p className="text-sm text-slate-400 line-clamp-2">{tutorial.description}</p>
                    <div className="mt-2 flex items-center gap-2 text-xs text-slate-400 font-medium">
                      <span className="bg-[#1ed760]/10 text-[#1ed760] px-2 py-0.5 rounded-full">{tutorial.category}</span>
                      <span>•</span>
                      <span>{tutorial.level}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Practical Guides Section - Guias Práticos */}
          <div>
            <div className="px-4 pb-3 pt-2">
              <h3 className="text-lg font-bold leading-tight">Guias Práticos</h3>
            </div>
            <div className="grid grid-cols-2 gap-3 px-4">
              {STATIC_GUIDES.map((guide) => (
                <div 
                  key={guide.id}
                  className="bg-[#121212] p-4 rounded-[1.5rem] flex flex-col justify-between h-40 shadow-sm border border-white/5 hover:border-[#1ed760]/50 transition-colors cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-full bg-[#1ed760]/10 flex items-center justify-center mb-3 group-hover:bg-[#1ed760] group-hover:scale-110 transition-all duration-300 text-[#1ed760] group-hover:text-black">
                    {GuideIconMap[guide.icon]}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white leading-tight mb-1">{guide.title}</h4>
                    <p className="text-xs text-slate-400">{guide.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Spacer for bottom navigation */}
          <div className="h-8" />
        </div>

        <MobileBottomNavigation />
      </div>
    );
  }

  // Desktop: Selected Tutorial View
  if (selectedTutorial) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6">
          <Button 
            variant="outline" 
            onClick={() => setSelectedTutorial(null)}
            className="mb-6"
          >
            ← Voltar aos Tutoriais
          </Button>

          <div className="bg-black rounded-lg aspect-video mb-6 flex items-center justify-center">
            <div className="text-center text-white">
              <Play size={64} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg">Player de Vídeo</p>
              <p className="text-sm opacity-75">Em breve: {selectedTutorial.title}</p>
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">{selectedTutorial.title}</h1>
            <p className="text-muted-foreground mb-4">{selectedTutorial.description}</p>
            
            <div className="flex items-center gap-4 mb-4">
              <Badge variant="secondary">{selectedTutorial.category}</Badge>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock size={16} />
                {selectedTutorial.duration}
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Eye size={16} />
                {selectedTutorial.views.toLocaleString()} visualizações
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Heart size={16} className="mr-2" />
                Curtir
              </Button>
              <Button variant="outline" size="sm">
                <Share2 size={16} className="mr-2" />
                Compartilhar
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <MessageCircle size={20} />
                Sugestões e Dúvidas
              </h2>

              <Card className="mb-6">
                <CardContent className="p-4">
                  <div className="flex gap-2 mb-3">
                    <Button
                      variant={commentType === 'suggestion' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCommentType('suggestion')}
                    >
                      💡 Sugestão
                    </Button>
                    <Button
                      variant={commentType === 'doubt' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCommentType('doubt')}
                    >
                      ❓ Dúvida
                    </Button>
                  </div>
                  
                  <Textarea
                    placeholder={commentType === 'suggestion' 
                      ? "Compartilhe sua sugestão para melhorar este tutorial..."
                      : "Faça sua pergunta sobre o conteúdo do tutorial..."
                    }
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="mb-3"
                  />
                  
                  <Button onClick={handleSubmitComment} disabled={!newComment.trim()}>
                    Enviar {commentType === 'suggestion' ? 'Sugestão' : 'Dúvida'}
                  </Button>
                </CardContent>
              </Card>

              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <Card key={comment.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={comment.avatar} />
                            <AvatarFallback>{comment.author[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{comment.author}</span>
                              <Badge variant={comment.type === 'suggestion' ? 'default' : 'secondary'} className="text-xs">
                                {comment.type === 'suggestion' ? '💡 Sugestão' : '❓ Dúvida'}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-1">{comment.content}</p>
                            <span className="text-xs text-muted-foreground">{comment.timestamp}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Tutoriais Relacionados</h3>
              <div className="space-y-3">
                {tutorials
                  .filter(t => t.id !== selectedTutorial.id)
                  .slice(0, 4)
                  .map((tutorial) => (
                    <Card 
                      key={tutorial.id} 
                      className="cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => setSelectedTutorial(tutorial)}
                    >
                      <CardContent className="p-3">
                        <div className="flex gap-3">
                          <div 
                            className="w-24 h-16 rounded bg-cover bg-center flex-shrink-0"
                            style={{ backgroundImage: `url(${tutorial.thumbnail})` }}
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm line-clamp-2">{tutorial.title}</h4>
                            <p className="text-xs text-muted-foreground mt-1">{tutorial.duration}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Desktop: Main tutorial list
  if (loading) {
    return (
    <ProOnlyWrapper featureName="Tutoriais Exclusivos">
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center gap-4 mb-6">
              <Skeleton className="h-10 w-40" />
              {desktopCategories.map((_, i) => (
                <Skeleton key={i} className="h-10 w-24" />
              ))}
            </div>

            <Skeleton className="h-64 w-full rounded-xl mb-8" />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i}>
                  <Skeleton className="h-48 w-full rounded-t-lg" />
                  <CardContent className="p-4">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </ProOnlyWrapper>
    );
  }

  return (
    <ProOnlyWrapper featureName="Tutoriais Exclusivos">
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <h1 className="text-2xl font-bold mr-4">Tutoriais</h1>
            {desktopCategories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>

          {filteredTutorials.length > 0 && (
            <Card 
              className="mb-8 overflow-hidden cursor-pointer group"
              onClick={() => handleWatchTutorial(filteredTutorials[0])}
            >
              <div className="relative">
                <div 
                  className="h-64 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                  style={{ backgroundImage: `url(${filteredTutorials[0].thumbnail})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-primary/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Play size={40} className="text-primary-foreground ml-1" />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 p-6">
                  <Badge className="mb-2">Destaque</Badge>
                  <h2 className="text-2xl font-bold text-white mb-1">{filteredTutorials[0].title}</h2>
                  <p className="text-white/80">{filteredTutorials[0].description}</p>
                </div>
              </div>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTutorials.slice(1).map((tutorial) => (
              <Card 
                key={tutorial.id} 
                className="overflow-hidden cursor-pointer group hover:shadow-lg transition-shadow"
                onClick={() => handleWatchTutorial(tutorial)}
              >
                <div className="relative">
                  <div 
                    className="h-48 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                    style={{ backgroundImage: `url(${tutorial.thumbnail})` }}
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center">
                      <Play size={28} className="text-primary-foreground ml-1" />
                    </div>
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded text-xs text-white">
                    {tutorial.duration}
                  </div>
                </div>
                <CardContent className="p-4">
                  <Badge variant="secondary" className="mb-2">{tutorial.category}</Badge>
                  <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                    {tutorial.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{tutorial.description}</p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Eye size={14} />
                      {tutorial.views.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      {tutorial.duration}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredTutorials.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                Nenhum tutorial encontrado para a categoria "{selectedCategory}".
              </p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setSelectedCategory('Todos')}
              >
                Ver todos os tutoriais
              </Button>
            </div>
          )}
        </div>
      </div>
    </ProOnlyWrapper>
  );
};

export default Tutorials;
