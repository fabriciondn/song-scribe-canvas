import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { HardDrive, ShieldCheck, Folder, GraduationCap, Users, Crown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { FunctionStatusModal } from '@/components/ui/function-status-modal';
import { ProUpgradeModal } from '@/components/ui/pro-upgrade-modal';

interface QuickAccessProps {
  isPro: boolean;
}

export const QuickAccess: React.FC<QuickAccessProps> = ({ isPro }) => {
  const [showComingSoonModal, setShowComingSoonModal] = useState(false);
  const [showProModal, setShowProModal] = useState(false);
  const [selectedProFeature, setSelectedProFeature] = useState('');

  const quickAccessItems = [
    {
      icon: HardDrive,
      title: 'Pendrive',
      subtitle: 'Armazenamento',
      link: '/pendrive',
      color: 'from-orange-500 to-amber-500',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/20 hover:border-orange-500/40',
      proOnly: true,
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
      icon: Users,
      title: 'Parcerias',
      subtitle: 'Colaborar',
      link: '/partnerships',
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20 hover:border-purple-500/40',
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

  const handleProFeatureClick = (featureName: string) => {
    setSelectedProFeature(featureName);
    setShowProModal(true);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm sm:text-base font-semibold text-foreground">Acesso Rápido</h2>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
        {quickAccessItems.map((item) => {
          const IconComponent = item.icon;
          const isLocked = item.proOnly && !isPro;
          
          // Coming soon items
          if (item.comingSoon) {
            return (
              <div 
                key={item.title} 
                onClick={() => setShowComingSoonModal(true)}
                className="cursor-pointer"
              >
                <Card className={`${item.borderColor} ${item.bgColor} hover:shadow-md transition-all duration-300 cursor-pointer group relative`}>
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

          // Pro-only items when user is not Pro - show card but with PRO tag and modal on click
          if (isLocked) {
            return (
              <div 
                key={item.title} 
                onClick={() => handleProFeatureClick(item.title)}
                className="cursor-pointer"
              >
                <Card className={`${item.borderColor} ${item.bgColor} hover:shadow-md transition-all duration-300 cursor-pointer group relative`}>
                  {/* PRO Badge */}
                  <Badge 
                    className="absolute -top-1.5 -right-1.5 bg-yellow-500 text-yellow-950 text-[9px] px-1.5 py-0.5 gap-0.5 z-10"
                  >
                    <Crown className="h-2.5 w-2.5" />
                    PRO
                  </Badge>
                  <CardContent className="p-3 flex flex-col items-center text-center">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${item.color} mb-2 group-hover:scale-110 transition-transform duration-300 opacity-80`}>
                      <IconComponent className="h-4 w-4 text-white" />
                    </div>
                    <h3 className="font-medium text-foreground text-xs leading-tight">{item.title}</h3>
                    <p className="text-[10px] text-muted-foreground">{item.subtitle}</p>
                  </CardContent>
                </Card>
              </div>
            );
          }
          
          // Regular items or Pro items for Pro users
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

      <ProUpgradeModal
        open={showProModal}
        onOpenChange={setShowProModal}
        featureName={selectedProFeature}
      />
    </div>
  );
};
