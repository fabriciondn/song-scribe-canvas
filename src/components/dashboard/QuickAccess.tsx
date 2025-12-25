import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { HardDrive, Calendar, Users, Plus, Folder, FileText, GraduationCap } from 'lucide-react';

interface QuickAccessProps {
  isPro: boolean;
}

export const QuickAccess: React.FC<QuickAccessProps> = ({ isPro }) => {
  const quickAccessItems = [
    {
      icon: HardDrive,
      title: 'Pendrive',
      subtitle: 'Armazenamento',
      link: '/pendrive',
      color: 'from-orange-500 to-amber-500',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/20 hover:border-orange-500/40',
    },
    {
      icon: Calendar,
      title: 'Registro Diário',
      subtitle: 'Nova obra',
      link: '/author-registration',
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20 hover:border-green-500/40',
    },
    {
      icon: Folder,
      title: 'Pastas',
      subtitle: 'Organizar',
      link: '/folders',
      color: 'from-yellow-500 to-orange-500',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/20 hover:border-yellow-500/40',
      proOnly: true,
    },
    {
      icon: GraduationCap,
      title: 'Tutoriais',
      subtitle: 'Aprender',
      link: '/tutorials',
      color: 'from-cyan-500 to-blue-500',
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/20 hover:border-cyan-500/40',
    },
  ];

  const filteredItems = quickAccessItems.filter(item => !item.proOnly || isPro);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Acesso Rápido</h2>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
          <Plus className="h-4 w-4 mr-1" />
          Adicionar
        </Button>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {filteredItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <Link key={item.title} to={item.link}>
              <Card className={`${item.borderColor} ${item.bgColor} hover:shadow-md transition-all duration-300 cursor-pointer group`}>
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${item.color} mb-3 group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-medium text-foreground text-sm">{item.title}</h3>
                  <p className="text-xs text-muted-foreground">{item.subtitle}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
