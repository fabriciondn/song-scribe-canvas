import React from 'react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Music, Users, Shield, FileText, Mic, Folder } from 'lucide-react';

const FeatureCarousel: React.FC = () => {
  const slides = [
    {
      id: 1,
      title: "Componha suas músicas",
      description: "Crie letras incríveis com nossa ferramenta de composição intuitiva",
      image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=400&fit=crop",
      icon: Music,
      action: "Começar Compondo",
      link: "/composer",
      gradient: "from-blue-500 to-purple-600"
    },
    {
      id: 2,
      title: "Colabore com outros artistas",
      description: "Trabalhe em parceria e crie músicas em colaboração",
      image: "https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=800&h=400&fit=crop",
      icon: Users,
      action: "Ver Parcerias",
      link: "/partnerships",
      gradient: "from-purple-500 to-pink-600"
    },
    {
      id: 3,
      title: "Proteja suas criações",
      description: "Registre suas obras e obtenha certificados de autoria",
      image: "https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?w=800&h=400&fit=crop",
      icon: Shield,
      action: "Registrar Obra",
      link: "/dashboard/registered-works",
      gradient: "from-green-500 to-teal-600"
    },
    {
      id: 4,
      title: "Organize seus projetos",
      description: "Mantenha suas composições organizadas em pastas inteligentes",
      image: "https://images.unsplash.com/photo-1470813740244-df37b8c1edcb?w=800&h=400&fit=crop",
      icon: Folder,
      action: "Gerenciar Pastas",
      link: "/folders",
      gradient: "from-orange-500 to-red-600"
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
          {slides.map((slide) => {
            const IconComponent = slide.icon;
            return (
              <CarouselItem key={slide.id} className="md:basis-1/2 lg:basis-1/3">
                <Card className="h-full overflow-hidden group hover:shadow-xl transition-all duration-300">
                  <div className="relative h-48 overflow-hidden">
                    <div className={`absolute inset-0 bg-gradient-to-br ${slide.gradient} opacity-90`} />
                    <img 
                      src={slide.image} 
                      alt={slide.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <IconComponent className="h-16 w-16 text-white opacity-80" />
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold mb-2 text-foreground">{slide.title}</h3>
                    <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
                      {slide.description}
                    </p>
                    <Button asChild className="w-full group-hover:scale-105 transition-transform duration-200">
                      <Link to={slide.link}>
                        {slide.action}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </CarouselItem>
            );
          })}
        </CarouselContent>
        <CarouselPrevious className="hidden md:flex" />
        <CarouselNext className="hidden md:flex" />
      </Carousel>
    </div>
  );
};

export default FeatureCarousel;