
import React from 'react';
import { useParams } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Play, User, Music, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

// Usando os mesmos dados mockados da página GuiaMusical
const mockProducers = [
  {
    id: 1,
    name: "João Silva",
    genres: ["Sertanejo", "Pop"],
    avatar: "https://images.unsplash.com/photo-1581092795360-fd1ca04f0952",
    coverImage: "https://images.unsplash.com/photo-1518495973542-4542c06a5843",
    bio: "Produtor musical com mais de 10 anos de experiência em música sertaneja e pop. Trabalhou com diversos artistas renomados do cenário nacional.",
    playlists: [
      { id: 101, title: "Melhores Composições 2023", tracks: 12 },
      { id: 102, title: "Sertanejo Universitário", tracks: 8 },
    ],
    followers: 1240,
    featuredWorks: ["Amor de Verão", "Lua Cheia", "Estrada da Vida"]
  },
  {
    id: 2,
    name: "Marina Santos",
    genres: ["MPB", "Jazz"],
    avatar: "https://images.unsplash.com/photo-1649972904349-6e44c42644a7",
    coverImage: "https://images.unsplash.com/photo-1501286353178-1ec871214838",
    bio: "Produtora especializada em MPB e Jazz, com formação pelo Conservatório de Música do Rio de Janeiro. Possui um estúdio próprio onde já produziu mais de 30 álbuns.",
    playlists: [
      { id: 201, title: "Colaborações MPB", tracks: 6 },
      { id: 202, title: "Instrumental Brasileiro", tracks: 14 },
    ],
    followers: 980,
    featuredWorks: ["Brisa do Mar", "Noites de Inverno", "Horizonte Azul"]
  },
  {
    id: 3,
    name: "Carlos Mendes",
    genres: ["Rock", "Pop Rock"],
    avatar: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158",
    coverImage: "https://images.unsplash.com/photo-1518495973542-4542c06a5843",
    bio: "Produtor e guitarrista com mais de 15 anos de carreira no rock nacional. Já trabalhou com as principais bandas do Brasil e possui um estúdio especializado em rock e pop rock.",
    playlists: [
      { id: 301, title: "Rock Nacional", tracks: 10 },
      { id: 302, title: "Baladas Pop Rock", tracks: 9 },
    ],
    followers: 1540,
    featuredWorks: ["Asas da Liberdade", "Estradas", "Coração de Pedra"]
  },
];

const ProducerProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const producer = mockProducers.find(p => p.id === Number(id));
  
  if (!producer) {
    return (
      <div className="container mx-auto py-12 text-center">
        <h2 className="text-2xl font-bold mb-4">Produtor não encontrado</h2>
        <Link to="/guia-musical">
          <Button>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Voltar para Guia Musical
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <Link to="/guia-musical" className="flex items-center mb-6 text-brand hover:underline">
        <ChevronLeft className="mr-1 h-4 w-4" />
        <span>Voltar para Guia Musical</span>
      </Link>
      
      {/* Cover Image and Avatar */}
      <div className="relative mb-16">
        <div className="h-64 w-full rounded-lg overflow-hidden">
          <img 
            src={producer.coverImage} 
            alt="Cover" 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute -bottom-12 left-8 flex items-end">
          <Avatar className="h-24 w-24 border-4 border-white">
            <AvatarImage src={producer.avatar} alt={producer.name} />
            <AvatarFallback>
              <User className="h-12 w-12" />
            </AvatarFallback>
          </Avatar>
          <div className="ml-4 mb-1">
            <h1 className="text-3xl font-bold">{producer.name}</h1>
            <div className="flex items-center gap-2">
              <span className="text-gray-600">{producer.followers} seguidores</span>
              <div className="flex gap-1">
                {producer.genres.map(genre => (
                  <Badge key={genre} variant="outline">{genre}</Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-12">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Sobre</h2>
          <p className="text-gray-700">{producer.bio}</p>
        </div>
        
        <Tabs defaultValue="playlists" className="mb-8">
          <TabsList>
            <TabsTrigger value="playlists">
              <Music className="h-4 w-4 mr-2" />
              Playlists
            </TabsTrigger>
            <TabsTrigger value="featured">Obras em Destaque</TabsTrigger>
          </TabsList>
          
          <TabsContent value="playlists" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {producer.playlists.map(playlist => (
                <Card key={playlist.id} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-lg">{playlist.title}</h3>
                        <p className="text-sm text-gray-500">{playlist.tracks} faixas</p>
                      </div>
                      <Button size="icon" className="rounded-full bg-brand hover:bg-brand-dark">
                        <Play className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="bg-gray-100 h-2 w-full rounded-full overflow-hidden">
                      <div className="bg-brand h-full" style={{ width: '35%' }}></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="featured" className="mt-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Composições já gravadas por artistas</h3>
              <ul className="list-disc pl-6 space-y-2">
                {producer.featuredWorks.map((work, index) => (
                  <li key={index} className="text-gray-700">{work}</li>
                ))}
              </ul>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="bg-gray-100 p-6 rounded-lg">
          <h2 className="text-lg font-medium mb-2">Quer trabalhar com {producer.name}?</h2>
          <p className="text-gray-600 mb-4">
            Entre em contato para saber mais sobre como iniciar uma parceria musical.
          </p>
          <Button>Entrar em contato</Button>
        </div>
      </div>
    </div>
  );
};

export default ProducerProfile;
