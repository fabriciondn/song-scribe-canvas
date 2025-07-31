import React from 'react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Music, Users, Shield, FileText, Mic, Folder } from 'lucide-react';

const FeatureCarousel: React.FC = () => {
  const banners = [
    {
      id: 1,
      title: "Componha suas músicas",
      subtitle: "Crie letras incríveis com nossa ferramenta de composição intuitiva",
      image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200&h=300&fit=crop",
      icon: Music,
      action: "Começar Compondo",
      link: "/composer",
      gradient: "from-blue-600/80 to-purple-600/80"
    },
    {
      id: 2,
      title: "Colabore com outros artistas",
      subtitle: "Trabalhe em parceria e crie músicas em colaboração",
      image: "https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=1200&h=300&fit=crop",
      icon: Users,
      action: "Ver Parcerias",
      link: "/partnerships",
      gradient: "from-purple-600/80 to-pink-600/80"
    },
    {
      id: 3,
      title: "Proteja suas criações",
      subtitle: "Registre suas obras e obtenha certificados de autoria",
      image: "https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?w=1200&h=300&fit=crop",
      icon: Shield,
      action: "Registrar Obra",
      link: "/dashboard/registered-works",
      gradient: "from-green-600/80 to-teal-600/80"
    },
    {
      id: 4,
      title: "Organize seus projetos",
      subtitle: "Mantenha suas composições organizadas em pastas inteligentes",
      image: "https://images.unsplash.com/photo-1470813740244-df37b8c1edcb?w=1200&h=300&fit=crop",
      icon: Folder,
      action: "Gerenciar Pastas",
      link: "/folders",
      gradient: "from-orange-600/80 to-red-600/80"
    }
  ];

  return (
    <div className="w-full mb-8">
      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent>
          {banners.map((banner) => {
            const IconComponent = banner.icon;
            return (
              <CarouselItem key={banner.id}>
                <div className="relative h-64 w-full overflow-hidden rounded-lg group cursor-pointer">
                  <img 
                    src={banner.image} 
                    alt={banner.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-r ${banner.gradient}`} />
                  <div className="absolute inset-0 flex items-center justify-between p-8">
                    <div className="flex items-center space-x-6">
                      <div className="p-4 bg-white/10 backdrop-blur-sm rounded-full">
                        <IconComponent className="h-12 w-12 text-white" />
                      </div>
                      <div>
                        <h2 className="text-3xl font-bold text-white mb-2">{banner.title}</h2>
                        <p className="text-white/90 text-lg max-w-md">{banner.subtitle}</p>
                      </div>
                    </div>
                    <Button 
                      asChild 
                      size="lg"
                      className="bg-white text-gray-900 hover:bg-white/90 shadow-lg mr-8"
                    >
                      <Link to={banner.link}>
                        {banner.action}
                      </Link>
                    </Button>
                  </div>
                </div>
              </CarouselItem>
            );
          })}
        </CarouselContent>
        <CarouselPrevious className="left-4" />
        <CarouselNext className="right-4" />
      </Carousel>
    </div>
  );
};

export default FeatureCarousel;