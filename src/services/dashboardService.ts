
import { supabase } from '@/integrations/supabase/client';

export interface DashboardStats {
  compositions: {
    total: number;
    finished: number;
    drafts: number;
    lastEdited?: {
      title: string;
      date: string;
    };
  };
  distribution: {
    totalEarnings: number;
    monthlyEarnings: number;
    lastPayment?: {
      amount: number;
      date: string;
    };
    topSong?: string;
  };
  partnerships: {
    active: number;
    recent: Array<{
      name: string;
      role: string;
    }>;
  };
  folders: {
    total: number;
    breakdown: Array<{
      name: string;
      count: number;
    }>;
  };
  registeredWorks: {
    total: number;
    lastRegistered?: {
      title: string;
      date: string;
    };
  };
}

export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    console.log('🔄 Iniciando carregamento das estatísticas do dashboard...');
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      throw new Error('No authenticated user');
    }

    const userId = session.user.id;
    console.log('👤 User ID:', userId);

    // Fetch all data in parallel for better performance
    const [songsResult, draftsResult, partnershipsResult, foldersResult, registeredWorksResult] = await Promise.allSettled([
      supabase.from('songs').select('*').eq('user_id', userId),
      supabase.from('drafts').select('*').eq('user_id', userId),
      supabase.from('partnerships').select('*').eq('user_id', userId),
      supabase.from('folders').select('*').eq('user_id', userId),
      supabase.from('author_registrations').select('*').eq('user_id', userId).eq('status', 'registered')
    ]);

    console.log('📊 Resultados das consultas:', {
      songs: songsResult.status,
      drafts: draftsResult.status,
      partnerships: partnershipsResult.status,
      folders: foldersResult.status,
      registeredWorks: registeredWorksResult.status
    });

    // Handle results and extract data
    const songs = songsResult.status === 'fulfilled' ? songsResult.value.data || [] : [];
    const drafts = draftsResult.status === 'fulfilled' ? draftsResult.value.data || [] : [];
    const partnerships = partnershipsResult.status === 'fulfilled' ? partnershipsResult.value.data || [] : [];
    const folders = foldersResult.status === 'fulfilled' ? foldersResult.value.data || [] : [];
    const registeredWorks = registeredWorksResult.status === 'fulfilled' ? registeredWorksResult.value.data || [] : [];

    // Log any errors
    [songsResult, draftsResult, partnershipsResult, foldersResult, registeredWorksResult].forEach((result, index) => {
      if (result.status === 'rejected') {
        const tables = ['songs', 'drafts', 'partnerships', 'folders', 'author_registrations'];
        console.error(`❌ Erro ao carregar ${tables[index]}:`, result.reason);
      }
    });

    console.log('📈 Dados carregados:', {
      songs: songs.length,
      drafts: drafts.length,
      partnerships: partnerships.length,
      folders: folders.length,
      registeredWorks: registeredWorks.length
    });

    // Calculate stats
    const totalSongs = songs.length;
    const totalDrafts = drafts.length;
    const totalCompositions = totalSongs + totalDrafts;

    // Get last edited song/draft
    const allCompositions = [
      ...songs.map(s => ({ ...s, type: 'song' })),
      ...drafts.map(d => ({ ...d, type: 'draft' }))
    ].sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime());

    const lastEdited = allCompositions[0] ? {
      title: allCompositions[0].title,
      date: new Date(allCompositions[0].updated_at || allCompositions[0].created_at).toLocaleDateString('pt-BR')
    } : undefined;

    // Group songs by folder for breakdown
    const folderBreakdown = folders.map(folder => {
      const songsInFolder = songs.filter(song => song.folder_id === folder.id).length;
      return {
        name: folder.name,
        count: songsInFolder
      };
    });

    // Add drafts and songs without folder
    const songsWithoutFolder = songs.filter(song => !song.folder_id).length;
    if (songsWithoutFolder > 0) {
      folderBreakdown.push({
        name: 'Sem pasta',
        count: songsWithoutFolder
      });
    }

    if (totalDrafts > 0) {
      folderBreakdown.push({
        name: 'Rascunhos',
        count: totalDrafts
      });
    }


    const lastRegisteredWork = registeredWorks.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];

    const dashboardStats = {
      compositions: {
        total: totalCompositions,
        finished: totalSongs,
        drafts: totalDrafts,
        lastEdited
      },
      distribution: {
        totalEarnings: 0, // Real distribution data would come from external APIs
        monthlyEarnings: 0,
        lastPayment: undefined,
        topSong: undefined
      },
      partnerships: {
        active: partnerships.length,
        recent: [] // Would need to fetch collaborator details from partnerships
      },
      folders: {
        total: folders.length,
        breakdown: folderBreakdown
      },
      registeredWorks: {
        total: registeredWorks.length,
        lastRegistered: lastRegisteredWork ? {
          title: lastRegisteredWork.title,
          date: new Date(lastRegisteredWork.created_at).toLocaleDateString('pt-BR')
        } : undefined
      }
    };

    console.log('✅ Estatísticas calculadas:', dashboardStats);
    return dashboardStats;

  } catch (error) {
    console.error('❌ Erro ao carregar estatísticas do dashboard:', error);
    throw error;
  }
};
