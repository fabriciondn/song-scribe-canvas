-- Adicionar coluna folder_id na tabela drafts para vincular rascunhos a pastas
ALTER TABLE public.drafts 
ADD COLUMN IF NOT EXISTS folder_id uuid REFERENCES public.folders(id) ON DELETE SET NULL;

-- Criar índice para melhorar performance de consultas por pasta
CREATE INDEX IF NOT EXISTS idx_drafts_folder_id ON public.drafts(folder_id);

-- Comentário para documentação
COMMENT ON COLUMN public.drafts.folder_id IS 'Pasta onde o rascunho está organizado (opcional)';