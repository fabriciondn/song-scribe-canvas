
import React from 'react';
import { Card, CardBody, Button, Chip } from '@nextui-org/react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Link } from 'react-router-dom';
import { Music, Users, Shield, Folder } from 'lucide-react';

const banners = [
  {
    id: 1,
    title: "Componha suas músicas",
    subtitle: "Crie letras incríveis com nossa ferramenta de composição intuitiva",
    image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200&h=300&fit=crop",
    icon: Music,
    action: "Começar Compondo",
    link: "/composer",
    gradient: "from-blue-600/90 to-purple-600/90"
  },
  {
    id: 2,
    title: "Colabore com outros artistas",
    subtitle: "Trabalhe em parceria e crie músicas em colaboração",
    image: "https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=1200&h=300&fit=crop",
    icon: Users,
    action: "Ver Parcerias",
    link: "/partnerships",
    gradient: "from-purple-600/90 to-pink-600/90"
  },
  {
    id: 3,
    title: "Proteja suas criações",
    subtitle: "Registre suas obras e obtenha certificados de autoria",
    image: "https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?w=1200&h=300&fit=crop",
    icon: Shield,
    action: "Registrar Obra",
    link: "/dashboard/registered-works",
    gradient: "from-green-600/90 to-teal-600/90"
  },
  {
    id: 4,
    title: "Organize seus projetos",
    subtitle: "Mantenha suas composições organizadas em pastas inteligentes",
    image: "https://images.unsplash.com/photo-1470813740244-df37b8c1edcb?w=1200&h=300&fit=crop",
    icon: Folder,
    action: "Gerenciar Pastas",
    link: "/folders",
    gradient: "from-orange-600/90 to-red-600/90"
  }
];

export const ModernFeatureCarousel: React.FC = () => {
  return (
    <div className="w-full max-w-7xl mx-auto px-4">
      <Carousel 
        opts={{ align: "start", loop: true }} 
        className="w-full"
      >
        <CarouselContent>
          {banners.map((banner) => {
            const IconComponent = banner.icon;
            
            return (
              <CarouselItem key={banner.id}>
                <Card className="relative overflow-hidden group cursor-pointer border-0 shadow-2xl">
                  <div className="relative h-64 w-full">
                    <img 
                      src={banner.image} 
                      alt={banner.title} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                    />
                    <div className={`absolute inset-0 bg-gradient-to-r ${banner.gradient} backdrop-blur-[1px]`} />
                    
                    <CardBody className="absolute inset-0 flex items-center justify-between p-8 z-10">
                      <div className="flex items-center gap-6 flex-1">
                        <div className="p-4 backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 shadow-2xl">
                          <IconComponent className="h-8 w-8 text-white" />
                        </div>
                        
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h2 className="text-3xl font-bold text-white leading-tight">
                              {banner.title}
                            </h2>
                            <Chip size="sm" className="bg-white/20 text-white border-white/30">
                              Novo
                            </Chip>
                          </div>
                          <p className="text-white/90 text-lg leading-relaxed">
                            {banner.subtitle}
                          </p>
                        </div>
                      </div>
                      
                      <Button 
                        as={Link}
                        to={banner.link}
                        size="lg"
                        className="bg-white/20 backdrop-blur-xl text-white border border-white/30 hover:bg-white/30 hover:scale-105 transition-all duration-300 font-semibold shadow-2xl ml-6"
                      >
                        {banner.action}
                      </Button>
                    </CardBody>
                  </div>
                </Card>
              </CarouselItem>
            );
          })}
        </CarouselContent>
        
        <CarouselPrevious className="left-4 bg-white/10 backdrop-blur-xl border-white/20 text-white hover:bg-white/20" />
        <CarouselNext className="right-4 bg-white/10 backdrop-blur-xl border-white/20 text-white hover:bg-white/20" />
      </Carousel>
    </div>
  );
};
