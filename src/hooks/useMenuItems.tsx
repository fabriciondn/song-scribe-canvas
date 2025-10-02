import { useMemo } from 'react';
import { useMenuFunctions } from '@/hooks/useMenuFunctions';
import { useUserRole } from '@/hooks/useUserRole';
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
  Trophy
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

  const menuItems = useMemo(() => {
    const baseItems: MenuItem[] = [
      {
        label: 'Dashboard',
        icon: BarChart3,
        path: '/dashboard',
        functionKey: 'dashboard',
        isPro: false
      },
      {
        label: 'Minhas Compras',
        icon: CreditCard,
        path: '/dashboard/my-purchases',
        functionKey: 'my-purchases',
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
        label: 'Bases',
        icon: FileMusic,
        path: '/bases',
        functionKey: 'bases',
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
        label: 'Rascunho',
        icon: BookText,
        path: '/drafts',
        functionKey: 'drafts',
        isPro: true
      },
      {
        label: 'Parcerias',
        icon: Users,
        path: '/partnerships',
        functionKey: 'partnerships',
        isPro: true
      },
      {
        label: 'Tutoriais',
        icon: ListMusic,
        path: '/dashboard/tutorials',
        functionKey: 'tutorials',
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
        label: 'Configurações',
        icon: User,
        path: '/dashboard/settings',
        functionKey: 'settings',
        isPro: false
      },
      {
        label: 'Upgrade Pro',
        icon: ArrowUp,
        path: '/subscription-checkout',
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
        label: 'Lixeira',
        icon: Trash2,
        path: '/dashboard/trash',
        functionKey: 'trash',
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
      },
      {
        label: 'Afiliados',
        icon: TrendingUp,
        path: '/affiliate',
        functionKey: 'affiliate',
        isPro: false
      }
    ];

    // Filtrar itens baseado no status das funções
    return baseItems
      .map(item => {
        const func = functions.find(f => f.function_key === item.functionKey);
        return {
          ...item,
          isHidden: func?.is_hidden || func?.status !== 'available' || false
        };
      })
      .filter(item => {
        // Remove apenas itens ocultos ou inativos
        if (item.isHidden) return false;
        
        return true;
      });
  }, [functions, isPro]);

  return {
    menuItems,
    isLoading: loading
  };
};
