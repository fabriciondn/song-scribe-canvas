
import { supabase } from '@/integrations/supabase/client';
import { nanoid } from 'nanoid';

export interface BaseMusical {
  id: string;
  name: string;
  genre: string;
  description?: string;
  file_path: string;
  file_url?: string;
  user_id: string;
  folder_id?: string;
  created_at: string;
  updated_at: string;
}

// Interface para criação de bases musicais
export interface BaseMusicalInput {
  name: string;
  genre: string;
  description: string;
  folder_id?: string;
  file: File;
}

// Função para garantir que o bucket existe
export const ensureMusicBasesBucketExists = async (): Promise<void> => {
  try {
    // O bucket já foi criado via SQL, então só precisamos verificar
    // se conseguimos acessá-lo para confirmar que está tudo certo
    const { data } = await supabase.storage.from('music_bases').list();
    
    // Se chegamos aqui, o bucket existe e está acessível
    console.log('Bucket de bases musicais está acessível');
  } catch (error) {
    console.error('Error accessing music bases bucket:', error);
    // Não lançamos o erro para evitar falhas na interface do usuário
  }
};

/**
 * Busca todas as bases musicais do usuário
 */
export const getBases = async (): Promise<BaseMusical[]> => {
  const { data, error } = await supabase
    .from('music_bases')
    .select('*')
    .is('deleted_at', null) // Exclude deleted bases
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching music bases:', error);
    throw new Error('Failed to fetch music bases');
  }

  // Adiciona URLs de arquivo para cada base
  const basesWithUrls = await Promise.all(
    data.map(async (base) => {
      let fileUrl = null;
      if (base.file_path) {
        const { data: { publicUrl } } = supabase.storage
          .from('music_bases')
          .getPublicUrl(base.file_path);
        fileUrl = publicUrl;
      }
      return {
        ...base,
        file_url: fileUrl
      };
    })
  );

  return basesWithUrls;
};

/**
 * Busca bases musicais de uma determinada pasta
 */
export const getBasesByFolder = async (folderId: string): Promise<BaseMusical[]> => {
  const { data, error } = await supabase
    .from('music_bases')
    .select('*')
    .eq('folder_id', folderId)
    .is('deleted_at', null) // Exclude deleted bases
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching music bases by folder:', error);
    throw new Error('Failed to fetch music bases by folder');
  }

  // Adiciona URLs de arquivo para cada base
  const basesWithUrls = await Promise.all(
    data.map(async (base) => {
      let fileUrl = null;
      if (base.file_path) {
        const { data: { publicUrl } } = supabase.storage
          .from('music_bases')
          .getPublicUrl(base.file_path);
        fileUrl = publicUrl;
      }
      return {
        ...base,
        file_url: fileUrl
      };
    })
  );

  return basesWithUrls;
};

/**
 * Busca uma base musical por ID
 */
export const getBaseById = async (id: string): Promise<BaseMusical | null> => {
  const { data, error } = await supabase
    .from('music_bases')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching music base:', error);
    return null;
  }

  // Adiciona URL do arquivo
  if (data && data.file_path) {
    const { data: { publicUrl } } = supabase.storage
      .from('music_bases')
      .getPublicUrl(data.file_path);
    
    return {
      ...data,
      file_url: publicUrl
    };
  }

  return data;
};

/**
 * Cria uma nova base musical
 */
export const createBaseMusical = async (
  baseInput: BaseMusicalInput
): Promise<BaseMusical | null> => {
  try {
    // 1. Primeiro, fazemos upload do arquivo
    const { name, genre, description, folder_id, file } = baseInput;
    
    const fileExtension = file.name.split('.').pop();
    const fileName = `${nanoid()}.${fileExtension}`;
    const filePath = `${genre}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('music_bases')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      throw new Error('Failed to upload music base file');
    }

    // 2. Depois, criamos o registro no banco de dados
    const { data: userData } = await supabase.auth.getSession();
    if (!userData.session?.user) {
      throw new Error('User must be logged in to create music bases');
    }

    const { data, error } = await supabase
      .from('music_bases')
      .insert({
        name,
        genre,
        description,
        folder_id: folder_id || null,
        file_path: filePath,
        user_id: userData.session.user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating music base record:', error);
      // Tenta remover o arquivo já que o registro falhou
      await supabase.storage.from('music_bases').remove([filePath]);
      throw new Error('Failed to create music base record');
    }

    // 3. Gera a URL pública para o arquivo
    const { data: { publicUrl } } = supabase.storage
      .from('music_bases')
      .getPublicUrl(filePath);

    return {
      ...data,
      file_url: publicUrl
    };
  } catch (error) {
    console.error('Error creating music base:', error);
    return null;
  }
};

/**
 * Remove uma base musical
 */
export const removeBaseMusical = async (id: string): Promise<boolean> => {
  try {
    // 1. Primeiro, obtenha o registro para ter o caminho do arquivo
    const { data, error: fetchError } = await supabase
      .from('music_bases')
      .select('file_path')
      .eq('id', id)
      .single();

    if (fetchError || !data) {
      console.error('Error fetching music base to delete:', fetchError);
      return false;
    }

    // 2. Remova o arquivo de storage
    if (data.file_path) {
      const { error: storageError } = await supabase.storage
        .from('music_bases')
        .remove([data.file_path]);

      if (storageError) {
        console.error('Error deleting music base file:', storageError);
        // Continuamos mesmo se falhar a remoção do arquivo
      }
    }

    // 3. Soft delete o registro do banco de dados
    const { error: deleteError } = await supabase
      .from('music_bases')
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: (await supabase.auth.getUser()).data.user?.id
      })
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting music base record:', deleteError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error removing music base:', error);
    return false;
  }
};

