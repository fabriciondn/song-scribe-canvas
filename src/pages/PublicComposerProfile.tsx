import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, Download, Loader2, ShieldCheck, Music2, Lock } from 'lucide-react';
import { generateCertificatePDF, type RegisteredWork } from '@/services/certificateService';
import { toast } from '@/hooks/use-toast';

interface PublicProfileData {
  profile: {
    name: string | null;
    artistic_name: string | null;
    avatar_url: string | null;
  };
  works: Array<RegisteredWork & { created_at: string }>;
}

const SLUG_RE = /^[a-z0-9-]+-\d{4}$/;

const PublicComposerProfile: React.FC = () => {
  const { slug = '' } = useParams<{ slug: string }>();
  const normalized = slug.toLowerCase();
  const isValid = SLUG_RE.test(normalized);
  const expectedDigits = isValid ? normalized.slice(-4) : '';

  const storageKey = `composer-access:${normalized}`;
  const [unlocked, setUnlocked] = React.useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem(storageKey) === '1';
  });
  const [cpfInput, setCpfInput] = React.useState('');
  const [cpfError, setCpfError] = React.useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['public-composer', normalized],
    enabled: isValid && unlocked,
    queryFn: async (): Promise<PublicProfileData | null> => {
      const { data, error } = await supabase.rpc('get_public_composer_profile', {
        p_slug: normalized,
      });
      if (error) throw error;
      return (data as unknown as PublicProfileData | null) ?? null;
    },
  });

  const [downloadingId, setDownloadingId] = React.useState<string | null>(null);

  const handleDownload = async (work: PublicProfileData['works'][number]) => {
    try {
      setDownloadingId(work.id);
      await generateCertificatePDF(work);
    } catch (e) {
      console.error(e);
      toast({
        title: 'Erro',
        description: 'Não foi possível gerar o certificado.',
        variant: 'destructive',
      });
    } finally {
      setDownloadingId(null);
    }
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    const digits = cpfInput.replace(/\D/g, '');
    if (digits.length !== 4) {
      setCpfError('Informe os 4 últimos dígitos do CPF.');
      return;
    }
    if (digits !== expectedDigits) {
      setCpfError('CPF não confere. Tente novamente.');
      return;
    }
    setCpfError(null);
    setUnlocked(true);
    try {
      sessionStorage.setItem(storageKey, '1');
    } catch {
      /* ignore */
    }
  };

  if (!isValid) {
    return <NotFoundState />;
  }

  if (!unlocked) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        <header className="border-b bg-background/80">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link to="/" className="font-bold text-lg text-foreground">
              Compuse
            </Link>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              Perfil público do compositor
            </span>
          </div>
        </header>
        <main className="container mx-auto px-4 py-12 max-w-md">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center mb-6">
                <div className="mx-auto h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <Lock className="h-7 w-7 text-primary" />
                </div>
                <h1 className="text-xl font-bold text-foreground">Acesso protegido</h1>
                <p className="text-sm text-muted-foreground mt-2">
                  Para visualizar os certificados deste compositor, informe os{' '}
                  <strong>4 últimos dígitos do CPF</strong>.
                </p>
              </div>
              <form onSubmit={handleUnlock} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cpf-last4">Últimos 4 dígitos do CPF</Label>
                  <Input
                    id="cpf-last4"
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={4}
                    placeholder="0000"
                    value={cpfInput}
                    onChange={(e) => {
                      setCpfInput(e.target.value.replace(/\D/g, '').slice(0, 4));
                      if (cpfError) setCpfError(null);
                    }}
                    className="text-center text-2xl tracking-[0.5em] font-mono"
                  />
                  {cpfError && (
                    <p className="text-xs text-destructive">{cpfError}</p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={cpfInput.length !== 4}>
                  Acessar certificados
                </Button>
              </form>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !data) {
    return <NotFoundState />;
  }

  const displayName = data.profile.artistic_name || data.profile.name || 'Compositor';
  const initials = (displayName || 'C')
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <header className="border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="font-bold text-lg text-foreground">
            Compuse
          </Link>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            Perfil público do compositor
          </span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 sm:py-12 max-w-4xl">
        <section className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-center sm:text-left mb-8">
          <Avatar className="h-20 w-20 sm:h-24 sm:w-24 ring-2 ring-primary/20">
            <AvatarImage src={data.profile.avatar_url || undefined} alt={displayName} />
            <AvatarFallback className="text-xl">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{displayName}</h1>
            {data.profile.artistic_name && data.profile.name && (
              <p className="text-sm text-muted-foreground">{data.profile.name}</p>
            )}
            <div className="mt-2 flex items-center justify-center sm:justify-start gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span>
                {data.works.length} {data.works.length === 1 ? 'obra registrada' : 'obras registradas'}
              </span>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <Music2 className="h-5 w-5 text-primary" />
            Certificados de Registro
          </h2>

          {data.works.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">
                  Este compositor ainda não possui obras registradas publicamente.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {data.works.map((work) => (
                <Card key={work.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{work.title}</h3>
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span>
                          Registrado em{' '}
                          {new Date(work.created_at).toLocaleDateString('pt-BR')}
                        </span>
                        {work.hash && (
                          <span className="font-mono">
                            Nº {work.hash.slice(0, 12).toUpperCase()}
                          </span>
                        )}
                        {work.genre && <span>{work.genre}</span>}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleDownload(work)}
                      disabled={downloadingId === work.id}
                      className="w-full sm:w-auto"
                    >
                      {downloadingId === work.id ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Gerando...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Baixar PDF
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        <footer className="mt-12 text-center text-xs text-muted-foreground">
          Página pública gerada por{' '}
          <Link to="/" className="text-primary hover:underline">
            Compuse
          </Link>
          .
        </footer>
      </main>
    </div>
  );
};

const NotFoundState: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-background px-4">
    <div className="max-w-md text-center">
      <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
      <h1 className="text-2xl font-bold text-foreground mb-2">Compositor não encontrado</h1>
      <p className="text-muted-foreground mb-6">
        Verifique se o link está correto. O endereço deve seguir o formato{' '}
        <code className="bg-muted px-1.5 py-0.5 rounded text-xs">/nome-1234</code>.
      </p>
      <Button asChild>
        <Link to="/">Ir para o início</Link>
      </Button>
    </div>
  </div>
);

export default PublicComposerProfile;
