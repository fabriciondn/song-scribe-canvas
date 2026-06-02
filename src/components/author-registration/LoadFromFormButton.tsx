import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { FileText, Mic, Loader2, ClipboardList } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  variant?: 'mobile' | 'desktop';
  className?: string;
}

interface FormWorkItem {
  formId: string;
  workIndex: number;
  title: string;
  genre?: string;
  lyrics?: string;
  audio_url?: string;
  created_at: string;
}

const onlyDigits = (s?: string | null) => (s || '').replace(/\D+/g, '');
const readWorkString = (work: any, keys: string[]) => {
  for (const key of keys) {
    const value = work?.[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
};

/**
 * Botão "Carregar do formulário" — lista obras enviadas pelo compositor
 * através do formulário público de cadastro (tabela public_registration_forms),
 * vinculadas ao usuário atual via CPF ou e-mail do perfil.
 */
export const LoadFromFormButton: React.FC<Props> = ({ variant = 'mobile', className }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = useCurrentUser();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<FormWorkItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !currentUser?.id) return;
    let mounted = true;
    setLoading(true);

    (async () => {
      try {
        // 1) Buscar perfil do usuário atual (cpf/email) para casar com o formulário público
        const { data: profile } = await supabase
          .from('profiles')
          .select('cpf, email')
          .eq('id', currentUser.id)
          .maybeSingle();

        const cpfDigits = onlyDigits(profile?.cpf);
        const email = (profile?.email || '').trim().toLowerCase();

        if (!cpfDigits && !email) {
          if (mounted) setItems([]);
          return;
        }

        // 2) Buscar formulários do compositor (admins têm RLS de SELECT)
        // Traz por email ou por CPF (normalização feita no client)
        const orFilters: string[] = [];
        if (email) orFilters.push(`email.ilike.${email}`);
        // CPF pode estar armazenado com máscara — buscamos por igualdade textual e por dígitos
        if (profile?.cpf) {
          orFilters.push(`cpf.eq.${profile.cpf}`);
          if (cpfDigits && cpfDigits !== profile.cpf) {
            orFilters.push(`cpf.eq.${cpfDigits}`);
          }
        }

        const { data: forms, error } = await supabase
          .from('public_registration_forms')
          .select('id, created_at, cpf, email, works')
          .or(orFilters.join(','))
          .order('created_at', { ascending: false });

        if (error) {
          console.warn('Falha ao buscar formulários públicos:', error);
          if (mounted) setItems([]);
          return;
        }

        // 3) Filtragem extra no client (CPF com/sem máscara, email case-insensitive)
        const filtered = (forms || []).filter((f: any) => {
          const fEmail = (f.email || '').trim().toLowerCase();
          const fCpf = onlyDigits(f.cpf);
          return (email && fEmail === email) || (cpfDigits && fCpf === cpfDigits);
        });

        // 4) Achatar lista de obras
        const list: FormWorkItem[] = [];
        for (const f of filtered) {
          const works = Array.isArray((f as any).works) ? ((f as any).works as any[]) : [];
          works.forEach((w, idx) => {
            list.push({
              formId: f.id,
              workIndex: idx,
              title: readWorkString(w, ['title', 'name']) || 'Sem título',
              genre: readWorkString(w, ['genre', 'genero']) || undefined,
              lyrics: readWorkString(w, ['lyrics', 'letra', 'content']) || undefined,
              audio_url: readWorkString(w, ['audio_url', 'audio_file_path', 'audioPath']) || undefined,
              created_at: f.created_at,
            });
          });
        }

        if (mounted) setItems(list);
      } catch (err) {
        console.error('Erro ao carregar obras do formulário:', err);
        if (mounted) setItems([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [open, currentUser?.id]);

  const handleSelect = (item: FormWorkItem) => {
    setOpen(false);
    try {
      sessionStorage.removeItem('author_registration_draft');
      sessionStorage.removeItem('mobile_registration_step1_draft');
      sessionStorage.removeItem('mobile_registration_step2_draft');
    } catch {}
    const base = location.pathname || '/dashboard/author-registration';
    navigate(`${base}?formWorkId=${item.formId}:${item.workIndex}`, { replace: false });
  };

  return (
    <>
      <Button
        type="button"
        variant={variant === 'mobile' ? 'secondary' : 'outline'}
        size="sm"
        onClick={() => setOpen(true)}
        className={className}
      >
        <ClipboardList className="h-4 w-4 mr-2" />
        Carregar do formulário
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="h-[80vh] bg-background">
          <SheetHeader>
            <SheetTitle>Escolha uma obra do formulário</SheetTitle>
          </SheetHeader>

          <div className="mt-4 overflow-y-auto h-[calc(80vh-90px)] space-y-2 pb-6">
            {loading && (
              <div className="flex items-center justify-center py-10 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando obras do formulário...
              </div>
            )}

            {!loading && items.length === 0 && (
              <div className="text-center py-10 text-muted-foreground text-sm px-4">
                Nenhuma obra vinda do formulário foi encontrada para este compositor.
                <br />
                <span className="text-xs">
                  Verifique se o CPF/e-mail do perfil é o mesmo informado no formulário público.
                </span>
              </div>
            )}

            {!loading &&
              items.map((item) => {
                const hasAudio = !!item.audio_url;
                return (
                  <button
                    key={`${item.formId}:${item.workIndex}`}
                    type="button"
                    onClick={() => handleSelect(item)}
                    className="w-full text-left flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent transition-colors"
                  >
                    <div className="w-10 h-10 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      {hasAudio ? <Mic className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{item.title}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {hasAudio ? 'Com áudio • ' : ''}
                        {item.genre ? `${item.genre} • ` : ''}
                        Enviado {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: ptBR })}
                      </p>
                    </div>
                  </button>
                );
              })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
