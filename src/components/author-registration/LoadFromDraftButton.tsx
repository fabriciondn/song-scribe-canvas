import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { FileEdit, Mic, Loader2, FilePlus2 } from 'lucide-react';
import { getDrafts } from '@/services/drafts/draftService';
import { Draft } from '@/services/drafts/types';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  variant?: 'mobile' | 'desktop';
  className?: string;
}

/**
 * Botão "Carregar de rascunho" — abre uma lista de rascunhos do usuário.
 * Ao escolher, navega para a página atual com ?draftId=<id>, que aciona
 * o pré-preenchimento no AuthorRegistration.
 */
export const LoadFromDraftButton: React.FC<Props> = ({ variant = 'mobile', className }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let mounted = true;
    setLoading(true);
    getDrafts()
      .then((data) => {
        if (mounted) setDrafts(data || []);
      })
      .catch(() => {
        if (mounted) setDrafts([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [open]);

  const handleSelect = (draft: Draft) => {
    setOpen(false);
    // Limpa storage do registro para evitar dados antigos sobrescreverem
    try {
      sessionStorage.removeItem('author_registration_draft');
      sessionStorage.removeItem('mobile_registration_step1_draft');
      sessionStorage.removeItem('mobile_registration_step2_draft');
    } catch {}
    const base = location.pathname || '/dashboard/author-registration';
    navigate(`${base}?draftId=${draft.id}`, { replace: false });
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
        <FilePlus2 className="h-4 w-4 mr-2" />
        Carregar de rascunho
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="h-[80vh] bg-background">
          <SheetHeader>
            <SheetTitle>Escolha um rascunho para pré-preencher</SheetTitle>
          </SheetHeader>

          <div className="mt-4 overflow-y-auto h-[calc(80vh-90px)] space-y-2 pb-6">
            {loading && (
              <div className="flex items-center justify-center py-10 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando rascunhos...
              </div>
            )}

            {!loading && drafts.length === 0 && (
              <div className="text-center py-10 text-muted-foreground text-sm">
                Você ainda não tem rascunhos salvos.
              </div>
            )}

            {!loading &&
              drafts.map((draft) => {
                const hasAudio = !!(draft.audio_url || (draft.audio_files && draft.audio_files.length > 0));
                return (
                  <button
                    key={draft.id}
                    type="button"
                    onClick={() => handleSelect(draft)}
                    className="w-full text-left flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent transition-colors"
                  >
                    <div className="w-10 h-10 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      {hasAudio ? <Mic className="h-5 w-5" /> : <FileEdit className="h-5 w-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{draft.title || 'Sem título'}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {hasAudio ? 'Com áudio • ' : ''}
                        Atualizado {formatDistanceToNow(new Date(draft.updated_at || draft.created_at), { addSuffix: true, locale: ptBR })}
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
