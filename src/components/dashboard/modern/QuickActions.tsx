
import React from 'react';
import { Card, CardBody, Button } from '@nextui-org/react';
import { Link } from 'react-router-dom';
import { Music, Users, Shield, Folder, Mic, FileText } from 'lucide-react';

const quickActions = [
  {
    title: 'Nova Composição',
    description: 'Começar a criar',
    icon: Music,
    link: '/composer',
    gradient: 'bg-gradient-to-br from-blue-500 to-purple-600',
    color: 'primary' as const
  },
  {
    title: 'Colaborar',
    description: 'Trabalhar em equipe',
    icon: Users,
    link: '/partnerships',
    gradient: 'bg-gradient-to-br from-purple-500 to-pink-600',
    color: 'secondary' as const
  },
  {
    title: 'Registrar Obra',
    description: 'Proteger criação',
    icon: Shield,
    link: '/dashboard/registered-works',
    gradient: 'bg-gradient-to-br from-green-500 to-teal-600',
    color: 'success' as const
  },
  {
    title: 'Organizar',
    description: 'Gerenciar pastas',
    icon: Folder,
    link: '/folders',
    gradient: 'bg-gradient-to-br from-orange-500 to-red-600',
    color: 'warning' as const
  }
];

export const QuickActions: React.FC = () => {
  return (
    <Card className="backdrop-blur-xl bg-white/5 border border-white/10">
      <CardBody className="p-6">
        <h2 className="text-xl font-semibold mb-4 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
          Ações Rápidas
        </h2>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            
            return (
              <Button
                key={action.title}
                as={Link}
                to={action.link}
                className={`h-auto p-4 flex-col gap-2 backdrop-blur-sm ${action.gradient} text-white hover:scale-105 transition-all duration-300`}
                variant="solid"
              >
                <Icon className="h-6 w-6" />
                <div className="text-center">
                  <p className="font-semibold text-sm">{action.title}</p>
                  <p className="text-xs opacity-90">{action.description}</p>
                </div>
              </Button>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
};
