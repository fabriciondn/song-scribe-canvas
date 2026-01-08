import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Play, MessageCircle, Heart, Share2, Clock, Eye, Search, Copyright, Handshake, DollarSign, ShieldCheck } from 'lucide-react';
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
}

interface Comment {
  id: string;
  author: string;
  avatar: string;
  content: string;
  timestamp: string;
  type: 'suggestion' | 'doubt';
}

// Material Icon component
const MaterialIcon: React.FC<{ name: string; className?: string }> = ({ name, className = '' }) => (
  <span className={`material-symbols-rounded ${className}`}>{name}</span>
);

// Static guides data
const STATIC_GUIDES = [
  { id: '1', title: 'Entendendo Royalties', description: 'Direitos autorais explicados.', icon: 'copyright' },
  { id: '2', title: 'Colaboração Segura', description: 'Contratos e splits.', icon: 'handshake' },
  { id: '3', title: 'Monetização', description: 'Spotify, Apple Music e mais.', icon: 'monetization_on' },
  { id: '4', title: 'Proteção Legal', description: 'Evite plágios.', icon: 'verified_user' },
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
      <div className="min-h-screen bg-background flex flex-col">
        <div className="sticky top-0 z-40 bg-background/90 backdrop-blur-md">
          <div className="flex items-center justify-between p-4 pb-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
          <div className="flex gap-3 px-4 pb-4 overflow-x-auto">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-9 w-20 rounded-full flex-shrink-0" />
            ))}
          </div>
        </div>
        <div className="flex-1 px-4 space-y-6 pb-24">
          <Skeleton className="h-64 w-full rounded-3xl" />
          <div className="space-y-4">
            <Skeleton className="h-48 w-full rounded-3xl" />
            <Skeleton className="h-48 w-full rounded-3xl" />
          </div>
        </div>
        <MobileBottomNavigation />
      </div>
    );
  }

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Sticky Header */}
        <div className="sticky top-0 z-40 bg-background/90 backdrop-blur-md transition-all duration-300">
          <div className="flex items-center justify-between p-4 pb-2">
            <h1 className="text-2xl font-bold leading-tight tracking-tight">Tutoriais</h1>
            <button className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-muted transition-colors">
              <Search className="w-5 h-5" />
            </button>
          </div>
          
          {/* Category Filters */}
          <div className="flex gap-3 px-4 pb-4 overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {mobileCategories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  "flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full px-5 transition-all active:scale-95",
                  selectedCategory === category
                    ? "bg-primary shadow-[0_0_10px_hsl(var(--primary)/0.3)]"
                    : "bg-muted border border-border hover:bg-muted/80"
                )}
              >
                <span className={cn(
                  "text-sm font-medium",
                  selectedCategory === category ? "text-primary-foreground font-bold" : "text-muted-foreground"
                )}>
                  {category}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col gap-6 px-4 pb-24">
          {/* Featured Section */}
          {filteredTutorials.length > 0 && (
            <div>
              <div className="pb-3 pt-2 flex items-center justify-between">
                <h3 className="text-lg font-bold leading-tight">Destaque</h3>
              </div>
              <div 
                className="relative group cursor-pointer overflow-hidden rounded-3xl bg-card shadow-lg border border-border"
                onClick={() => handleWatchTutorial(filteredTutorials[0])}
              >
                <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                <div 
                  className="w-full aspect-[4/3] bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                  style={{ backgroundImage: `url("${filteredTutorials[0].thumbnail}")` }}
                />
                <div className="absolute inset-0 z-20 flex items-center justify-center opacity-90 group-hover:opacity-100 transition-opacity">
                  <div className="w-14 h-14 rounded-full bg-primary/90 backdrop-blur-sm flex items-center justify-center pl-1 shadow-[0_0_20px_hsl(var(--primary)/0.5)]">
                    <Play className="w-8 h-8 text-primary-foreground fill-current" />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 z-20 p-5 flex flex-col gap-1">
                  <div className="inline-flex self-start items-center px-2 py-0.5 rounded bg-primary/90 backdrop-blur-sm text-[10px] font-bold uppercase tracking-wider text-primary-foreground mb-1">
                    Novo
                  </div>
                  <h2 className="text-white text-xl font-bold leading-tight">{filteredTutorials[0].title}</h2>
                  <div className="flex items-center gap-2 text-slate-300 text-sm font-medium mt-1">
                    <span className="flex items-center gap-1">
                      <MaterialIcon name="videocam" className="text-base text-primary" />
                      Vídeo
                    </span>
                    <span>•</span>
                    <span>{filteredTutorials[0].duration}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Learn Production Section */}
          {filteredTutorials.length > 1 && (
            <div>
              <div className="pb-2 pt-2 flex items-center justify-between">
                <h3 className="text-lg font-bold leading-tight">Aprenda Produção</h3>
                <button className="text-primary text-sm font-semibold hover:text-primary/80">Ver tudo</button>
              </div>
              <div className="flex flex-col gap-4">
                {filteredTutorials.slice(1, 3).map((tutorial) => (
                  <div 
                    key={tutorial.id}
                    className="flex flex-col bg-card rounded-3xl p-3 shadow-sm hover:bg-muted/50 transition-colors cursor-pointer group border border-border"
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
                      <h4 className="text-base font-bold leading-tight text-foreground mb-1 group-hover:text-primary transition-colors">
                        {tutorial.title}
                      </h4>
                      <p className="text-sm text-muted-foreground line-clamp-2">{tutorial.description}</p>
                      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground font-medium">
                        <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full">{tutorial.category}</span>
                        <span>•</span>
                        <span>Iniciante</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Practical Guides Section */}
          <div>
            <div className="pb-3 pt-2">
              <h3 className="text-lg font-bold leading-tight">Guias Práticos</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {STATIC_GUIDES.map((guide) => (
                <div 
                  key={guide.id}
                  className="bg-card p-4 rounded-3xl flex flex-col justify-between h-40 shadow-sm border border-border hover:border-primary/50 transition-colors cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
                    <MaterialIcon name={guide.icon} className="text-primary group-hover:text-primary-foreground transition-colors" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground leading-tight mb-1">{guide.title}</h4>
                    <p className="text-xs text-muted-foreground">{guide.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Empty state */}
          {filteredTutorials.length === 0 && !loading && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Nenhum tutorial encontrado para a categoria selecionada.
              </p>
            </div>
          )}
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
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={comment.avatar} />
                            <AvatarFallback>{comment.author[0]}</AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">{comment.author}</span>
                              <Badge 
                                variant={comment.type === 'suggestion' ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {comment.type === 'suggestion' ? '💡 Sugestão' : '❓ Dúvida'}
                              </Badge>
                              <span className="text-xs text-muted-foreground">{comment.timestamp}</span>
                            </div>
                            <p className="text-sm">{comment.content}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Tutoriais Relacionados</h3>
              <div className="space-y-3">
                {tutorials
                  .filter(t => t.id !== selectedTutorial.id)
                  .slice(0, 3)
                  .map((tutorial) => (
                    <Card 
                      key={tutorial.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setSelectedTutorial(tutorial)}
                    >
                      <CardContent className="p-3">
                        <div className="flex gap-3">
                          <img
                            src={tutorial.thumbnail}
                            alt={tutorial.title}
                            className="w-20 h-12 object-cover rounded"
                          />
                          <div className="flex-1">
                            <h4 className="font-medium text-sm line-clamp-2 mb-1">
                              {tutorial.title}
                            </h4>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock size={12} />
                              {tutorial.duration}
                            </div>
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

  // Desktop Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  // Desktop Empty State
  if (tutorials.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center py-12">
            <h1 className="text-4xl font-bold mb-2">Tutoriais</h1>
            <p className="text-muted-foreground">
              Nenhum tutorial disponível no momento. Volte em breve!
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Desktop Main View
  return (
    <ProOnlyWrapper featureName="Tutoriais">
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Tutoriais</h1>
            <p className="text-muted-foreground">
              Aprenda técnicas avançadas de composição e produção musical com nossos tutoriais exclusivos.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 mb-8">
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
            <div className="mb-12">
              <h2 className="text-2xl font-semibold mb-4">Em Destaque</h2>
              <Card 
                className="cursor-pointer hover:shadow-lg transition-shadow overflow-hidden"
                onClick={() => handleWatchTutorial(filteredTutorials[0])}
              >
                <div className="relative">
                  <img
                    src={filteredTutorials[0].thumbnail}
                    alt={filteredTutorials[0].title}
                    className="w-full h-64 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <Play size={64} className="text-white" />
                  </div>
                  <Badge className="absolute top-4 left-4">{filteredTutorials[0].category}</Badge>
                  <div className="absolute bottom-4 right-4 bg-black/70 text-white px-2 py-1 rounded text-sm">
                    {filteredTutorials[0].duration}
                  </div>
                </div>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-2">{filteredTutorials[0].title}</h3>
                  <p className="text-muted-foreground mb-4">{filteredTutorials[0].description}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Eye size={16} />
                      {filteredTutorials[0].views.toLocaleString()} visualizações
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div>
            <h2 className="text-2xl font-semibold mb-6">
              {selectedCategory === 'Todos' ? 'Todos os Tutoriais' : `Categoria: ${selectedCategory}`}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTutorials.slice(1).map((tutorial) => (
                <Card 
                  key={tutorial.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow overflow-hidden"
                  onClick={() => handleWatchTutorial(tutorial)}
                >
                  <div className="relative">
                    <img
                      src={tutorial.thumbnail}
                      alt={tutorial.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <Play size={48} className="text-white" />
                    </div>
                    <Badge className="absolute top-3 left-3">{tutorial.category}</Badge>
                    <div className="absolute bottom-3 right-3 bg-black/70 text-white px-2 py-1 rounded text-sm">
                      {tutorial.duration}
                    </div>
                  </div>
                  
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2 line-clamp-2">{tutorial.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {tutorial.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Eye size={14} />
                      {tutorial.views.toLocaleString()} visualizações
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {filteredTutorials.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Nenhum tutorial encontrado para a categoria selecionada.
              </p>
            </div>
          )}
        </div>
      </div>
    </ProOnlyWrapper>
  );
};

export default Tutorials;
