CREATE TABLE IF NOT EXISTS public.system_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for admins
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'system_settings' AND policyname = 'Admins can manage system settings'
  ) THEN
    CREATE POLICY "Admins can manage system settings" 
    ON public.system_settings 
    FOR ALL 
    USING (
      EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'admin'
      )
    );
  END IF;
END $$;

-- Insert some default placeholders for OpenPix if they don't exist
INSERT INTO public.system_settings (key, value, description)
VALUES 
  ('OPENPIX_APP_ID', '', 'ID do Aplicativo OpenPix para integração de pagamentos'),
  ('OPENPIX_WEBHOOK_SECRET', '', 'Chave secreta para validação de webhooks da OpenPix')
ON CONFLICT (key) DO NOTHING;