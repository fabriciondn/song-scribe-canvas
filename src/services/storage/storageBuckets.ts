
import { supabase } from '@/integrations/supabase/client';

// Ensure required buckets exist
export const ensureAudioBucketExists = async (): Promise<void> => {
  try {
    // O bucket já foi criado via SQL, então só precisamos verificar
    // se conseguimos acessá-lo para confirmar que está tudo certo
    const { data } = await supabase.storage.from('audio').list();
    
    // Se chegamos aqui, o bucket existe e está acessível
    console.log('Audio bucket is accessible');
  } catch (error) {
    console.error('Error accessing audio bucket:', error);
    // Não lançamos o erro para evitar falhas na interface do usuário
  }
};

export const ensureBackupBucketExists = async (): Promise<void> => {
  try {
    // Check if the bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const exists = buckets?.some(bucket => bucket.name === 'backups');

    // If the bucket doesn't exist, create it
    if (!exists) {
      const { error } = await supabase.storage.createBucket('backups', {
        public: true, // Make backups accessible
      });
      if (error) throw error;
    }
  } catch (error) {
    console.error('Error ensuring backup bucket exists:', error);
    // We'll continue even if this fails
  }
};

export const ensureMusicBasesBucketExists = async (): Promise<void> => {
  try {
    // O bucket já foi criado via SQL, então só precisamos verificar
    // se conseguimos acessá-lo para confirmar que está tudo certo
    const { data } = await supabase.storage.from('music_bases').list();
    
    // Se chegamos aqui, o bucket existe e está acessível
    console.log('Music bases bucket is accessible');
  } catch (error) {
    console.error('Error accessing music bases bucket:', error);
    // Não lançamos o erro para evitar falhas na interface do usuário
  }
};
