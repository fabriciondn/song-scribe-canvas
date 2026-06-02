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

interface PendingWork {
  id: string;
  title: string | null;
  lyrics: string | null;
  audio_file_path: string | null;
  genre: string | null;
  song_version: string | null;
  created_at: string;
}

/**
 * Botão "Carregar do formulário" — lista obras enviadas pelo usuário
 * através do formulário público (status='pending' em author_registrations).
 * Ao escolher, navega com ?formWorkId=<id>, que aciona o pré-preenchimento
 * em AuthorRegistration.
 */
export const LoadFromFormButton: React.FC<Props> = ({ variant = 'mobile', className }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = useCurrentUser();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<PendingWork[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !currentUser?.id) return;
    let mounted = true;
    setLoading(true);
    supabase
      .from('author_registrations')
      .select('id, title, lyrics, audio_file_path, genre, song_version, created_at')
      .eq('user_id', currentUser.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (mounted) setItems((data as PendingWork[]) || []);
      })
      .then(undefined, () => {
        if (mounted) setItems([]);
      })
      .then(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [open, currentUser?.id]);

  const handleSelect = (item: PendingWork) => {
    setOpen(false);
    try {
      sessionStorage.removeItem('author_registration_draft');
      sessionStorage.removeItem('mobile_registration_step1_draft');
      sessionStorage.removeItem('mobile_registration_step2_draft');
    } catch {}
    const base = location.pathname || '/dashboard/author-registration';
    navigate(`${base}?formWorkId=${item.id}`, { replace: false });
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
                Nenhuma obra pendente vinda do formulário foi encontrada para este usuário.
              </div>
            )}

            {!loading &&
              items.map((item) => {
                const hasAudio = !!item.audio_file_path;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item)}
                    className="w-full text-left flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent transition-colors"
                  >
                    <div className="w-10 h-10 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      {hasAudio ? <Mic className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{item.title || 'Sem título'}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {hasAudio ? 'Com áudio • ' : ''}
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
