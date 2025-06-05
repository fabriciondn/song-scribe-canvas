
-- Adicionar políticas RLS para tabelas que não possuem

-- Políticas para a tabela songs
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own songs" 
ON public.songs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own songs" 
ON public.songs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own songs" 
ON public.songs 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own songs" 
ON public.songs 
FOR DELETE 
USING (auth.uid() = user_id);

-- Políticas para a tabela drafts
ALTER TABLE public.drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own drafts" 
ON public.drafts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own drafts" 
ON public.drafts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own drafts" 
ON public.drafts 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own drafts" 
ON public.drafts 
FOR DELETE 
USING (auth.uid() = user_id);

-- Políticas para a tabela folders
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own folders" 
ON public.folders 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own folders" 
ON public.folders 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own folders" 
ON public.folders 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own folders" 
ON public.folders 
FOR DELETE 
USING (auth.uid() = user_id);

-- Políticas para a tabela templates
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own templates" 
ON public.templates 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own templates" 
ON public.templates 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates" 
ON public.templates 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates" 
ON public.templates 
FOR DELETE 
USING (auth.uid() = user_id);

-- Políticas para a tabela partnerships (faltavam algumas operações)
CREATE POLICY "Users can insert partnerships" 
ON public.partnerships 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their partnerships" 
ON public.partnerships 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their partnerships" 
ON public.partnerships 
FOR DELETE 
USING (auth.uid() = user_id);

-- Políticas para a tabela partnership_collaborators (faltavam algumas operações)
CREATE POLICY "Partnership members can insert collaborators" 
ON public.partnership_collaborators 
FOR INSERT 
WITH CHECK (
  auth.uid() IN (
    SELECT p.user_id FROM public.partnerships p WHERE p.id = partnership_id
  )
);

CREATE POLICY "Partnership members can update collaborators" 
ON public.partnership_collaborators 
FOR UPDATE 
USING (
  auth.uid() IN (
    SELECT p.user_id FROM public.partnerships p WHERE p.id = partnership_id
    UNION
    SELECT user_id FROM public.partnership_collaborators WHERE partnership_id = partnership_collaborators.partnership_id
  )
);

CREATE POLICY "Partnership members can delete collaborators" 
ON public.partnership_collaborators 
FOR DELETE 
USING (
  auth.uid() IN (
    SELECT p.user_id FROM public.partnerships p WHERE p.id = partnership_id
  )
);

-- Políticas para a tabela partnership_tokens
ALTER TABLE public.partnership_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partnership owners can manage tokens" 
ON public.partnership_tokens 
FOR ALL 
USING (
  auth.uid() IN (
    SELECT p.user_id FROM public.partnerships p WHERE p.id = partnership_id
  )
);

-- Políticas para a tabela music_bases
ALTER TABLE public.music_bases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own music bases" 
ON public.music_bases 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own music bases" 
ON public.music_bases 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own music bases" 
ON public.music_bases 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own music bases" 
ON public.music_bases 
FOR DELETE 
USING (auth.uid() = user_id);

-- Políticas para a tabela profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);
