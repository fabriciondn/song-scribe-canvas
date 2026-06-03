import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { FileText, Mic, Loader2, ClipboardList, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import type { Json } from '@/integrations/supabase/types';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  variant?: 'mobile' | 'desktop';
  className?: string;
  lookupCpf?: string;
  lookupEmail?: string;
  /**
   * Quando true, busca os formulários mais recentes sem filtrar por CPF/e-mail
   * (útil para admins que querem carregar a obra de qualquer compositor).
   * Um campo de busca aparece para refinar por nome/CPF/e-mail/título.
   */
  allowAll?: boolean;
}

interface FormWorkItem {
  formId: string;
  workIndex: number;
  title: string;
  genre?: string;
  lyrics?: string;
  audio_url?: string;
  created_at: string;
  composerName?: string;
  composerCpf?: string;
  composerEmail?: string;
}

type PublicRegistrationWork = {
  title?: string;
  name?: string;
  genre?: string;
  genero?: string;
  lyrics?: string;
  letra?: string;
  content?: string;
  audio_url?: string;
  audio_file_path?: string;
  audioPath?: string;
};

const escapeOrValue = (value: string) => value.replace(/,/g, '\\,');

const onlyDigits = (s?: string | null) => (s || '').replace(/\D+/g, '');
const readWorkString = (work: any, keys: string[]) => {
  for (const key of keys) {
    const value = work?.[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
};
const toWorkList = (value: Json | null): PublicRegistrationWork[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is PublicRegistrationWork => !!item && typeof item === 'object' && !Array.isArray(item));
};

export const LoadFromFormButton: React.FC<Props> = ({
  variant = 'mobile',
  className,
  lookupCpf,
  lookupEmail,
  allowAll = false,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = useCurrentUser();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<FormWorkItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [usedAllMode, setUsedAllMode] = useState(false);

  useEffect(() => {
    if (!open || !currentUser?.id) return;
    let mounted = true;
    setLoading(true);
    setSearchQuery('');

    (async () => {
      try {
        const explicitCpf = (lookupCpf || '').trim();
        const explicitEmail = (lookupEmail || '').trim().toLowerCase();

        let profile: { cpf?: string | null; email?: string | null } | null = null;
        if (!explicitCpf && !explicitEmail && currentUser?.id) {
          const { data } = await supabase
            .from('profiles')
            .select('cpf, email')
            .eq('id', currentUser.id)
            .maybeSingle();
          profile = data;
        }

        const cpfDigits = onlyDigits(explicitCpf || profile?.cpf);
        const rawCpf = (explicitCpf || profile?.cpf || '').trim();
        const email = (explicitEmail || profile?.email || '').trim().toLowerCase();

        const orFilters: string[] = [];
        if (email) orFilters.push(`email.ilike.${escapeOrValue(email)}`);
        if (rawCpf) {
          orFilters.push(`cpf.eq.${escapeOrValue(rawCpf)}`);
          if (cpfDigits && cpfDigits !== rawCpf) {
            orFilters.push(`cpf.eq.${escapeOrValue(cpfDigits)}`);
          }
        }

        const runQuery = async (useFilters: boolean) => {
          let query = supabase
            .from('public_registration_forms')
            .select('id, created_at, cpf, email, full_name, works')
            .order('created_at', { ascending: false })
            .limit(useFilters ? 200 : 100);
          if (useFilters && orFilters.length > 0) {
            query = query.or(orFilters.join(','));
          }
          return await query;
        };

        let forms: Array<{
          id: string;
          created_at: string;
          cpf: string | null;
          email: string | null;
          full_name?: string | null;
          works: Json | null;
        }> = [];
        let usedAll = false;

        if (orFilters.length > 0) {
          const { data, error } = await runQuery(true);
          if (error) console.warn('Falha ao buscar formulários públicos:', error);
          const filtered = (data || []).filter((f: any) => {
            const fEmail = (f.email || '').trim().toLowerCase();
            const fCpf = onlyDigits(f.cpf);
            return (email && fEmail === email) || (cpfDigits && fCpf === cpfDigits);
          });
          forms = filtered;
        }

        // Fallback admin: se não achou nada e allowAll, busca os últimos formulários
        if (forms.length === 0 && allowAll) {
          const { data, error } = await runQuery(false);
          if (error) console.warn('Falha ao buscar formulários (admin):', error);
          forms = data || [];
          usedAll = true;
        }

        const list: FormWorkItem[] = [];
        for (const f of forms) {
          const works = toWorkList(f.works);
          works.forEach((w, idx) => {
            list.push({
              formId: f.id,
              workIndex: idx,
              title: readWorkString(w, ['title', 'name']) || 'Sem título',
              genre: readWorkString(w, ['genre', 'genero']) || undefined,
              lyrics: readWorkString(w, ['lyrics', 'letra', 'content']) || undefined,
              audio_url: readWorkString(w, ['audio_url', 'audio_file_path', 'audioPath']) || undefined,
              created_at: f.created_at,
              composerName: (f.full_name as string) || undefined,
              composerCpf: (f.cpf as string) || undefined,
              composerEmail: (f.email as string) || undefined,
            });
          });
        }

        if (mounted) {
          setItems(list);
          setUsedAllMode(usedAll);
        }
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
  }, [open, currentUser?.id, lookupCpf, lookupEmail, allowAll]);

  const visibleItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return items;
    const qDigits = onlyDigits(q);
    return items.filter((it) => {
      const hay = [it.title, it.composerName, it.composerEmail, it.genre]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      const cpfDigits = onlyDigits(it.composerCpf);
      return hay.includes(q) || (qDigits && cpfDigits.includes(qDigits));
    });
  }, [items, searchQuery]);

  const handleSelect = (item: FormWorkItem) => {
    setOpen(false);
    try {
      sessionStorage.removeItem('author_registration_draft');
      sessionStorage.removeItem('mobile_registration_step1_draft');
      sessionStorage.removeItem('mobile_registration_step2_draft');
    } catch {}
    const base = location.pathname || '/dashboard/author-registration';
    navigate(base, {
      replace: false,
      state: {
        prefillWork: {
          formId: item.formId,
          workIndex: item.workIndex,
          title: item.title,
          genre: item.genre || '',
          lyrics: item.lyrics || '',
          audio_url: item.audio_url || '',
        },
      },
    });
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

          {(allowAll || items.length > 6) && (
            <div className="mt-3 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nome, CPF, e-mail ou título..."
                className="pl-9"
              />
            </div>
          )}

          {usedAllMode && (
            <p className="mt-2 text-xs text-muted-foreground">
              Modo admin: nenhuma obra vinculada ao perfil ativo, exibindo os formulários mais recentes. Use a busca para localizar o compositor.
            </p>
          )}

          <div className="mt-3 overflow-y-auto h-[calc(80vh-150px)] space-y-2 pb-6">
            {loading && (
              <div className="flex items-center justify-center py-10 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando obras do formulário...
              </div>
            )}

            {!loading && visibleItems.length === 0 && (
              <div className="text-center py-10 text-muted-foreground text-sm px-4">
                Nenhuma obra encontrada.
                <br />
                <span className="text-xs">
                  Verifique se o CPF/e-mail do compositor corresponde ao usado no formulário público.
                </span>
              </div>
            )}

            {!loading &&
              visibleItems.map((item) => {
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
                        {item.composerName ? `${item.composerName} • ` : ''}
                        {item.composerCpf ? `${item.composerCpf} • ` : ''}
                        {hasAudio ? 'Com áudio • ' : ''}
                        {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: ptBR })}
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
