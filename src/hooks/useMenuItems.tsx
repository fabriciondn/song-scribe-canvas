import { useMemo } from 'react';
import { useMenuFunctions } from '@/hooks/useMenuFunctions';
import { useUserRole } from '@/hooks/useUserRole';
import { useAffiliateRole } from '@/hooks/useAffiliateRole';
import { 
  BarChart3, 
  Shield, 
  Edit, 
  FileMusic, 
  Folder, 
  BookText, 
  Users, 
  ListMusic, 
  User, 
  Crown, 
  Trash2, 
  Settings,
  CreditCard,
  ArrowUp,
  TrendingUp,
  Trophy,
  Usb
} from 'lucide-react';

export interface MenuItem {
  label: string;
  icon: any;
  path: string;
  functionKey: string;
  isPro: boolean;
  isHidden?: boolean;
}

export const useMenuItems = () => {
  const { functions, loading } = useMenuFunctions();
  const { isPro } = useUserRole();
  const { isAffiliate } = useAffiliateRole();

  const menuItems = useMemo(() => {
    const baseItems: MenuItem[] = [
      // Menu principal na ordem definida
      {
        label: 'Dashboard',
        icon: BarChart3,
        path: '/dashboard',
        functionKey: 'dashboard',
        isPro: false
      },
      {
        label: 'Registro autoral',
        icon: Shield,
        path: '/dashboard/author-registration',
        functionKey: 'author-registration',
        isPro: false
      },
      {
        label: 'Compor',
        icon: BookText,
        path: '/drafts',
        functionKey: 'drafts',
        isPro: true
      },
      {
        label: 'Pastas',
        icon: Folder,
        path: '/folders',
        functionKey: 'folders',
        isPro: true
      },
      {
        label: 'Pendrive',
        icon: Usb,
        path: '/pendrive',
        functionKey: 'pendrive',
        isPro: true
      },
      {
        label: 'Ranking',
        icon: Trophy,
        path: '/dashboard/ranking',
        functionKey: 'ranking',
        isPro: false
      },
      {
        label: 'Tutoriais',
        icon: ListMusic,
        path: '/dashboard/tutorials',
        functionKey: 'tutorials',
        isPro: true
      },
      {
        label: 'Lixeira',
        icon: Trash2,
        path: '/dashboard/trash',
        functionKey: 'trash',
        isPro: true
      },
      {
        label: 'Minhas Compras',
        icon: CreditCard,
        path: '/dashboard/my-purchases',
        functionKey: 'my-purchases',
        isPro: false
      },
      {
        label: 'Configurações',
        icon: User,
        path: '/dashboard/settings',
        functionKey: 'settings',
        isPro: false
      },
      {
        label: 'Afiliados',
        icon: TrendingUp,
        path: '/affiliate',
        functionKey: 'affiliate',
        isPro: false
      },
      // Itens ocultos ou secundários
      {
        label: 'Rascunho',
        icon: Edit,
        path: '/composer',
        functionKey: 'composer',
        isPro: true
      },
      {
        label: 'Cifrador',
        icon: FileMusic,
        path: '/cifrador',
        functionKey: 'cifrador',
        isPro: true
      },
      {
        label: 'Cifrador Neo',
        icon: FileMusic,
        path: '/cifrador-neo',
        functionKey: 'cifrador-neo',
        isPro: true,
      },
      {
        label: 'Parcerias',
        icon: Users,
        path: '/partnerships',
        functionKey: 'partnerships',
        isPro: true
      },
      {
        label: 'Upgrade Pro',
        icon: ArrowUp,
        path: '/dashboard/subscription-checkout',
        functionKey: 'upgrade',
        isPro: false
      },
      {
        label: 'Planos',
        icon: Crown,
        path: '/plans',
        functionKey: 'plans',
        isPro: false
      },
      {
        label: 'Administração',
        icon: Settings,
        path: '/admin',
        functionKey: 'admin',
        isPro: false
      },
      {
        label: 'Moderação',
        icon: Shield,
        path: '/moderator',
        functionKey: 'moderator',
        isPro: false
      }
    ];

    // Filtrar itens baseado no status das funções
    return baseItems
      .map(item => {
        const func = functions.find(f => f.function_key === item.functionKey);
        return {
          ...item,
          isHidden: func?.is_hidden || false
        };
      })
      .filter(item => {
        // Remover a função "Planos" do menu
        if (item.functionKey === 'plans') return false;
        
        // Para a função "affiliate": se estiver oculta, mostrar apenas para afiliados
        if (item.functionKey === 'affiliate' && item.isHidden) {
          return isAffiliate;
        }
        
        // Para outras funções: remove itens ocultos
        if (item.isHidden) return false;
        
        // Remove itens com status diferente de available
        const func = functions.find(f => f.function_key === item.functionKey);
        if (func && func.status !== 'available') return false;
        
        return true;
      });
  }, [functions, isPro, isAffiliate]);

  return {
    menuItems,
    isLoading: loading
  };
};
