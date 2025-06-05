
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
  templates: {
    created: number;
    generated: number;
    lastDA?: {
      title: string;
      date: string;
    };
  };
}

export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      throw new Error('No authenticated user');
    }

    const userId = session.user.id;

    // Fetch compositions (songs)
    const { data: songs, error: songsError } = await supabase
      .from('songs')
      .select('*')
      .eq('user_id', userId);

    if (songsError) throw songsError;

    // Fetch drafts
    const { data: drafts, error: draftsError } = await supabase
      .from('drafts')
      .select('*')
      .eq('user_id', userId);

    if (draftsError) throw draftsError;

    // Fetch partnerships
    const { data: partnerships, error: partnershipsError } = await supabase
      .from('partnerships')
      .select('*')
      .eq('user_id', userId);

    if (partnershipsError) throw partnershipsError;

    // Fetch folders
    const { data: folders, error: foldersError } = await supabase
      .from('folders')
      .select('*')
      .eq('user_id', userId);

    if (foldersError) throw foldersError;

    // Fetch templates
    const { data: templates, error: templatesError } = await supabase
      .from('templates')
      .select('*')
      .eq('user_id', userId);

    if (templatesError) throw templatesError;

    // Calculate stats
    const totalSongs = songs?.length || 0;
    const totalDrafts = drafts?.length || 0;
    const totalCompositions = totalSongs + totalDrafts;

    // Get last edited song/draft
    const allCompositions = [
      ...(songs || []).map(s => ({ ...s, type: 'song' })),
      ...(drafts || []).map(d => ({ ...d, type: 'draft' }))
    ].sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime());

    const lastEdited = allCompositions[0] ? {
      title: allCompositions[0].title,
      date: new Date(allCompositions[0].updated_at || allCompositions[0].created_at).toLocaleDateString('pt-BR')
    } : undefined;

    // Group songs by folder for breakdown
    const folderBreakdown = folders?.map(folder => {
      const songsInFolder = songs?.filter(song => song.folder_id === folder.id).length || 0;
      return {
        name: folder.name,
        count: songsInFolder
      };
    }) || [];

    // Add drafts and songs without folder
    const songsWithoutFolder = songs?.filter(song => !song.folder_id).length || 0;
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

    const lastTemplate = templates?.sort((a, b) => 
      new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime()
    )[0];

    return {
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
        active: partnerships?.length || 0,
        recent: [] // Would need to fetch collaborator details from partnerships
      },
      folders: {
        total: folders?.length || 0,
        breakdown: folderBreakdown
      },
      templates: {
        created: templates?.length || 0,
        generated: 0, // Would need to track DA generations
        lastDA: lastTemplate ? {
          title: `DA - ${lastTemplate.name}`,
          date: new Date(lastTemplate.updated_at || lastTemplate.created_at).toLocaleDateString('pt-BR')
        } : undefined
      }
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    // Return empty stats on error
    return {
      compositions: { total: 0, finished: 0, drafts: 0 },
      distribution: { totalEarnings: 0, monthlyEarnings: 0 },
      partnerships: { active: 0, recent: [] },
      folders: { total: 0, breakdown: [] },
      templates: { created: 0, generated: 0 }
    };
  }
};
