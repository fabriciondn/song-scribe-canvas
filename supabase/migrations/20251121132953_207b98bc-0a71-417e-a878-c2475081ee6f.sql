
-- Verificar e habilitar extensão http necessária para net.http_post
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

-- Garantir que o trigger está corretamente associado
DROP TRIGGER IF EXISTS trigger_generate_temp_certificate ON public.author_registrations;

CREATE TRIGGER trigger_generate_temp_certificate
  AFTER UPDATE ON public.author_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_temp_certificate_on_registration();
