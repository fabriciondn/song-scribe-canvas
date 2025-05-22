
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Play, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

// Dados de exemplo para o marketplace
const mockProducers = [
  {
    id: 1,
    name: "João Silva",
    genres: ["Sertanejo", "Pop"],
    avatar: "",
    playlists: [
      { id: 101, title: "Melhores Composições 2023", tracks: 12 },
      { id: 102, title: "Sertanejo Universitário", tracks: 8 },
    ]
  },
  {
    id: 2,
    name: "Marina Santos",
    genres: ["MPB", "Jazz"],
    avatar: "",
    playlists: [
      { id: 201, title: "Colaborações MPB", tracks: 6 },
      { id: 202, title: "Instrumental Brasileiro", tracks: 14 },
    ]
  },
  {
    id: 3,
    name: "Carlos Mendes",
    genres: ["Rock", "Pop Rock"],
    avatar: "",
    playlists: [
      { id: 301, title: "Rock Nacional", tracks: 10 },
      { id: 302, title: "Baladas Pop Rock", tracks: 9 },
    ]
  },
];

const GuiaMusical: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  
  const filteredProducers = mockProducers.filter(producer => 
    producer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    producer.genres.some(genre => genre.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Guia Musical</h1>
      <p className="text-gray-700 mb-6">
        Descubra produtores musicais parceiros, explore seus portfolios e ouça playlists 
        exclusivas de composições já gravadas.
      </p>
      
      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <Input 
          placeholder="Busque por produtores, gêneros musicais..." 
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      <Tabs defaultValue="producers" className="mb-8">
        <TabsList>
          <TabsTrigger value="producers">Produtores</TabsTrigger>
          <TabsTrigger value="playlists">Playlists</TabsTrigger>
          <TabsTrigger value="genres">Gêneros</TabsTrigger>
        </TabsList>
        
        <TabsContent value="producers" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducers.map(producer => (
              <Card key={producer.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="bg-gradient-to-r from-purple-600 to-blue-500 h-24 flex items-center justify-center">
                    <Avatar className="h-16 w-16 border-4 border-white">
                      <AvatarImage src={producer.avatar} alt={producer.name} />
                      <AvatarFallback>
                        <User className="h-8 w-8" />
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-bold text-xl">{producer.name}</h3>
                    <div className="flex flex-wrap gap-1 mt-2 mb-4">
                      {producer.genres.map(genre => (
                        <Badge key={genre} variant="outline">{genre}</Badge>
                      ))}
                    </div>
                    
                    <h4 className="font-medium text-sm text-gray-500 mb-2">Playlists</h4>
                    {producer.playlists.map(playlist => (
                      <div key={playlist.id} className="flex items-center justify-between py-2 border-b last:border-0">
                        <span className="text-sm">{playlist.title}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">{playlist.tracks} faixas</span>
                          <button className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center text-white hover:bg-green-600">
                            <Play className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {filteredProducers.length === 0 && (
            <div className="text-center py-10">
              <p>Nenhum produtor encontrado com o termo "{searchTerm}"</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="playlists">
          <div className="text-center py-10">
            <h2 className="text-2xl font-semibold mb-4">Em breve</h2>
            <p>Todas as playlists dos produtores serão exibidas aqui em uma visão consolidada.</p>
          </div>
        </TabsContent>
        
        <TabsContent value="genres">
          <div className="text-center py-10">
            <h2 className="text-2xl font-semibold mb-4">Em breve</h2>
            <p>Navegue por gênero musical para encontrar produtores especializados.</p>
          </div>
        </TabsContent>
      </Tabs>
      
      <div className="bg-gray-100 p-4 rounded-lg">
        <h2 className="text-lg font-medium mb-2">Quer ser um produtor parceiro?</h2>
        <p className="text-sm text-gray-600">
          Se você é um produtor musical e gostaria de divulgar seu trabalho em nossa plataforma,
          entre em contato conosco para saber como fazer parte do nosso guia musical.
        </p>
      </div>
    </div>
  );
};

export default GuiaMusical;
