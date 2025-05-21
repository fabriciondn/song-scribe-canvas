
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from '@supabase/supabase-js/dist/main/lib/helpers';

export interface BaseMusical {
  id: string;
  name: string;
  genre: string;
  description?: string;
  file_path: string;
  folder_id?: string;
  created_at?: string;
  updated_at?: string;
  file_url?: string;
}

export interface BaseMusicalInput {
  name: string;
  genre: string;
  description?: string;
  folder_id?: string;
  file: File;
}

// Obter todas as bases musicais do usuário
export const getBases = async (): Promise<BaseMusical[]> => {
  try {
    const { data, error } = await supabase
      .from('music_bases')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Gerar URLs temporárias para os arquivos
    const basesWithUrls = await Promise.all((data || []).map(async (base) => {
      const { data: fileData } = await supabase
        .storage
        .from('music_bases')
        .createSignedUrl(base.file_path, 3600); // URL válida por 1 hora
      
      return {
        ...base,
        file_url: fileData?.signedUrl
      };
    }));

    return basesWithUrls;
  } catch (error) {
    console.error('Erro ao buscar bases musicais:', error);
    throw error;
  }
};

// Obter bases musicais por pasta
export const getBasesByFolder = async (folderId: string): Promise<BaseMusical[]> => {
  try {
    const { data, error } = await supabase
      .from('music_bases')
      .select('*')
      .eq('folder_id', folderId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Gerar URLs temporárias para os arquivos
    const basesWithUrls = await Promise.all((data || []).map(async (base) => {
      const { data: fileData } = await supabase
        .storage
        .from('music_bases')
        .createSignedUrl(base.file_path, 3600); // URL válida por 1 hora
      
      return {
        ...base,
        file_url: fileData?.signedUrl
      };
    }));

    return basesWithUrls;
  } catch (error) {
    console.error('Erro ao buscar bases musicais por pasta:', error);
    throw error;
  }
};

// Criar uma nova base musical
export const createBaseMusical = async (baseInput: BaseMusicalInput): Promise<BaseMusical> => {
  try {
    const { file, ...baseData } = baseInput;
    
    // 1. Fazer upload do arquivo
    const fileExt = file.name.split('.').pop();
    const filePath = `${uuidv4()}.${fileExt}`;
    
    const { error: uploadError } = await supabase
      .storage
      .from('music_bases')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // 2. Inserir registro na tabela music_bases
    const { data, error } = await supabase
      .from('music_bases')
      .insert({
        name: baseData.name,
        genre: baseData.genre,
        description: baseData.description || null,
        folder_id: baseData.folder_id || null,
        file_path: filePath
      })
      .select()
      .single();

    if (error) {
      // Em caso de erro, tentar excluir o arquivo carregado
      await supabase.storage.from('music_bases').remove([filePath]);
      throw error;
    }

    // 3. Gerar URL temporária para o arquivo
    const { data: fileData } = await supabase
      .storage
      .from('music_bases')
      .createSignedUrl(filePath, 3600); // URL válida por 1 hora

    return {
      ...data,
      file_url: fileData?.signedUrl
    };
  } catch (error) {
    console.error('Erro ao criar base musical:', error);
    throw error;
  }
};

// Remover uma base musical
export const removeBaseMusical = async (baseId: string): Promise<void> => {
  try {
    // 1. Obter o registro da base para descobrir o arquivo
    const { data: baseData, error: getError } = await supabase
      .from('music_bases')
      .select('file_path')
      .eq('id', baseId)
      .single();

    if (getError) throw getError;

    // 2. Remover o registro do banco de dados
    const { error: deleteError } = await supabase
      .from('music_bases')
      .delete()
      .eq('id', baseId);

    if (deleteError) throw deleteError;

    // 3. Remover o arquivo do storage (mesmo que falhe, o registro já foi removido)
    if (baseData?.file_path) {
      await supabase
        .storage
        .from('music_bases')
        .remove([baseData.file_path])
        .catch((error) => {
          console.error('Erro ao remover arquivo (não crítico):', error);
        });
    }
  } catch (error) {
    console.error('Erro ao remover base musical:', error);
    throw error;
  }
};

// Verificar e garantir que o bucket de áudio existe
export const ensureMusicBasesBucketExists = async (): Promise<void> => {
  try {
    // O bucket já foi criado via SQL, então só precisamos verificar
    // se conseguimos acessá-lo para confirmar que está tudo certo
    const { data } = await supabase.storage.from('music_bases').list();
    
    // Se chegamos aqui, o bucket existe e está acessível
    console.log('Bucket de bases musicais está acessível');
  } catch (error) {
    console.error('Erro ao acessar bucket de bases musicais:', error);
  }
};
