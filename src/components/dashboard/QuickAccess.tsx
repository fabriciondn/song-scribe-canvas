import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { HardDrive, ShieldCheck, Folder, GraduationCap } from 'lucide-react';
import { useState } from 'react';
import { FunctionStatusModal } from '@/components/ui/function-status-modal';

interface QuickAccessProps {
  isPro: boolean;
}

export const QuickAccess: React.FC<QuickAccessProps> = ({ isPro }) => {
  const [showComingSoonModal, setShowComingSoonModal] = useState(false);
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
      icon: ShieldCheck,
      title: 'Novo registro',
      subtitle: 'Proteger obra',
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
      comingSoon: true,
    },
  ];

  const filteredItems = quickAccessItems.filter(item => !item.proOnly || isPro);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm sm:text-base font-semibold text-foreground">Acesso Rápido</h2>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {filteredItems.map((item) => {
          const IconComponent = item.icon;
          
          if (item.comingSoon) {
            return (
              <div 
                key={item.title} 
                onClick={() => setShowComingSoonModal(true)}
                className="cursor-pointer"
              >
                <Card className={`${item.borderColor} ${item.bgColor} hover:shadow-md transition-all duration-300 cursor-pointer group`}>
                  <CardContent className="p-3 flex flex-col items-center text-center">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${item.color} mb-2 group-hover:scale-110 transition-transform duration-300`}>
                      <IconComponent className="h-4 w-4 text-white" />
                    </div>
                    <h3 className="font-medium text-foreground text-xs leading-tight">{item.title}</h3>
                    <p className="text-[10px] text-muted-foreground">{item.subtitle}</p>
                  </CardContent>
                </Card>
              </div>
            );
          }
          
          return (
            <Link key={item.title} to={item.link}>
              <Card className={`${item.borderColor} ${item.bgColor} hover:shadow-md transition-all duration-300 cursor-pointer group`}>
                <CardContent className="p-3 flex flex-col items-center text-center">
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${item.color} mb-2 group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className="h-4 w-4 text-white" />
                  </div>
                  <h3 className="font-medium text-foreground text-xs leading-tight">{item.title}</h3>
                  <p className="text-[10px] text-muted-foreground">{item.subtitle}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
      
      <FunctionStatusModal
        isOpen={showComingSoonModal}
        onClose={() => setShowComingSoonModal(false)}
        status="coming_soon"
        functionName="Tutoriais"
        functionDescription="Em breve você terá acesso a tutoriais completos para aproveitar melhor a plataforma."
      />
    </div>
  );
};
