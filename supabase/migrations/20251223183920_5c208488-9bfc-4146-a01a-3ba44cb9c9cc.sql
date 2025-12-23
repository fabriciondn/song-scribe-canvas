-- Adicionar coluna para armazenar a base selecionada no rascunho
ALTER TABLE public.drafts
ADD COLUMN selected_base_id uuid REFERENCES public.music_bases(id) ON DELETE SET NULL;