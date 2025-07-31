import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Play, MessageCircle, Heart, Share2, Clock, Eye } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

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

const mockTutorials: Tutorial[] = [
  {
    id: '1',
    title: 'Como Compor Sua Primeira Música',
    description: 'Aprenda os fundamentos da composição musical e crie sua primeira música do zero.',
    thumbnail: '/lovable-uploads/913b0b45-af0f-4a18-9433-06da553e8273.png',
    duration: '15:30',
    views: 1234,
    category: 'Composição',
    videoUrl: '#'
  },
  {
    id: '2',
    title: 'Técnicas de Harmonia Avançada',
    description: 'Domine técnicas avançadas de harmonia para enriquecer suas composições.',
    thumbnail: '/lovable-uploads/87b8e4b6-6bc8-4091-b080-aa4d3f63dfaa.png',
    duration: '22:15',
    views: 892,
    category: 'Harmonia',
    videoUrl: '#'
  },
  {
    id: '3',
    title: 'Criando Melodias Marcantes',
    description: 'Aprenda a criar melodias que ficam na cabeça e conectam com o público.',
    thumbnail: '/lovable-uploads/b59e106c-f55f-44c4-9ac6-5f29494e1251.png',
    duration: '18:45',
    views: 567,
    category: 'Melodia',
    videoUrl: '#'
  },
  {
    id: '4',
    title: 'Arranjos e Produção Musical',
    description: 'Transforme suas ideias musicais em arranjos completos e produzidos.',
    thumbnail: '/lovable-uploads/34f3e3cb-f162-46fc-bd7b-472265904f88.png',
    duration: '25:00',
    views: 1456,
    category: 'Produção',
    videoUrl: '#'
  },
  {
    id: '5',
    title: 'Letra e Poesia na Música',
    description: 'Desenvolva suas habilidades de escrita e crie letras impactantes.',
    thumbnail: '/lovable-uploads/a10d0d4b-cf1d-4fbc-954c-cdb4fd0eeacc.png',
    duration: '20:30',
    views: 789,
    category: 'Letra',
    videoUrl: '#'
  },
  {
    id: '6',
    title: 'Colaboração Musical Online',
    description: 'Aprenda a colaborar com outros músicos usando ferramentas digitais.',
    thumbnail: '/lovable-uploads/b2e99156-0e7f-46c8-8b49-eafea58416f9.png',
    duration: '12:20',
    views: 345,
    category: 'Colaboração',
    videoUrl: '#'
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
  const [comments, setComments] = useState<Comment[]>(mockComments);
  const [newComment, setNewComment] = useState('');
  const [commentType, setCommentType] = useState<'suggestion' | 'doubt'>('suggestion');
  const { toast } = useToast();

  const categories = ['Todos', 'Composição', 'Harmonia', 'Melodia', 'Produção', 'Letra', 'Colaboração'];
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  const filteredTutorials = selectedCategory === 'Todos' 
    ? mockTutorials 
    : mockTutorials.filter(tutorial => tutorial.category === selectedCategory);

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

          {/* Video Player */}
          <div className="bg-black rounded-lg aspect-video mb-6 flex items-center justify-center">
            <div className="text-center text-white">
              <Play size={64} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg">Player de Vídeo</p>
              <p className="text-sm opacity-75">Em breve: {selectedTutorial.title}</p>
            </div>
          </div>

          {/* Video Info */}
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

          {/* Comments Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <MessageCircle size={20} />
                Sugestões e Dúvidas
              </h2>

              {/* Add Comment */}
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

              {/* Comments List */}
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

            {/* Sidebar with related tutorials */}
            <div>
              <h3 className="font-semibold mb-4">Tutoriais Relacionados</h3>
              <div className="space-y-3">
                {mockTutorials
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Tutoriais</h1>
          <p className="text-muted-foreground">
            Aprenda técnicas avançadas de composição e produção musical com nossos tutoriais exclusivos.
          </p>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map((category) => (
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

        {/* Featured Tutorial */}
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

        {/* Tutorials Grid */}
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
  );
};

export default Tutorials;