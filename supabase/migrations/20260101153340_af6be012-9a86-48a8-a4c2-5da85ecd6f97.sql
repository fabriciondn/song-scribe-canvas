-- Criar tabela para configurações de pagamento de moderadores
CREATE TABLE public.moderator_payment_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  moderator_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  mercadopago_access_token TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.moderator_payment_settings ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem gerenciar configurações de pagamento
CREATE POLICY "Admins can manage moderator payment settings"
ON public.moderator_payment_settings
FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.admin_users 
  WHERE user_id = auth.uid() 
  AND role IN ('admin', 'super_admin')
));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_moderator_payment_settings_updated_at
BEFORE UPDATE ON public.moderator_payment_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Adicionar comentário na tabela
COMMENT ON TABLE public.moderator_payment_settings IS 'Armazena tokens do Mercado Pago para moderadores receberem pagamentos direto';