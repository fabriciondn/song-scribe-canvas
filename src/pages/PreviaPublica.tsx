import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  Music, Play, Pause, CheckCircle2, XCircle, Clock, Loader2, Lock,
} from 'lucide-react';

interface Track {
  id: string;
  track_name: string;
  storage_path: string;
  preview_seconds: number;
  position: number;
}

interface PreviewData {
  id: string;
  client_name: string;
  project_title: string | null;
  status: string;
  client_comment: string | null;
  reviewed_at: string | null;
  created_at: string;
  tracks: Track[];
}

const TrackPlayer: React.FC<{ track: Track }> = ({ track }) => {
  const [url, setUrl] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const ensureUrl = async () => {
    if (url) return url;
    setLoading(true);
    const { data, error } = await supabase.storage
      .from('music-previews')
      .createSignedUrl(track.storage_path, 60 * 10);
    setLoading(false);
    if (error || !data?.signedUrl) {
      toast.error('Erro ao carregar áudio');
      return null;
    }
    setUrl(data.signedUrl);
    return data.signedUrl;
  };

  const toggle = async () => {
    const a = audioRef.current;
    if (!a) {
      const u = await ensureUrl();
      if (!u) return;
      // wait next tick for ref
      setTimeout(() => audioRef.current?.play(), 50);
      return;
    }
    if (playing) {
      a.pause();
    } else {
      if (!url) {
        const u = await ensureUrl();
        if (!u) return;
      }
      a.play();
    }
  };

  const onTimeUpdate = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.currentTime >= track.preview_seconds) {
      a.pause();
      a.currentTime = 0;
      setProgress(0);
      setPlaying(false);
      return;
    }
    setProgress((a.currentTime / track.preview_seconds) * 100);
  };

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="font-semibold truncate">{track.track_name}</div>
          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            <Lock className="h-3 w-3" />Prévia de {track.preview_seconds}s
          </div>
        </div>
        <Button size="icon" onClick={toggle} disabled={loading} className="rounded-full h-12 w-12 shrink-0">
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
        </Button>
      </div>
      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
      </div>
      {url && (
        <audio
          ref={audioRef}
          src={url}
          preload="none"
          controlsList="nodownload noplaybackrate"
          onContextMenu={(e) => e.preventDefault()}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => { setPlaying(false); setProgress(0); }}
          onTimeUpdate={onTimeUpdate}
        />
      )}
    </div>
  );
};

const PreviaPublica: React.FC = () => {
  const params = useParams<{ token?: string; slug?: string }>();
  const token = params.token || params.slug;
  const [data, setData] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data: res, error } = await supabase.rpc('get_music_preview_by_token', { p_token: token });
    setLoading(false);
    if (error || !res) {
      setData(null);
      return;
    }
    setData(res as unknown as PreviewData);
  };

  useEffect(() => {
    load();
    // Prevent right-click globally on this page
    const handler = (e: MouseEvent) => e.preventDefault();
    document.addEventListener('contextmenu', handler);
    return () => document.removeEventListener('contextmenu', handler);
  }, [token]);

  const submitReview = async (status: 'approved' | 'rejected') => {
    if (status === 'rejected' && !comment.trim()) {
      toast.error('Conte rapidamente o que ajustar antes de recusar');
      return;
    }
    setSubmitting(true);
    const { data: res, error } = await supabase.rpc('submit_music_preview_review', {
      p_token: token,
      p_status: status,
      p_comment: comment.trim() || null,
    });
    setSubmitting(false);
    if (error || !(res as any)?.success) {
      toast.error('Não foi possível enviar sua resposta');
      return;
    }
    toast.success(status === 'approved' ? 'Prévia aprovada!' : 'Resposta enviada');
    load();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/30">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/30 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-3">
            <XCircle className="h-12 w-12 mx-auto text-destructive" />
            <h1 className="text-xl font-bold">Link inválido</h1>
            <p className="text-muted-foreground text-sm">
              Esta prévia não existe ou foi removida.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 py-8 px-4 select-none">
      <div className="max-w-2xl mx-auto space-y-6">
        <header className="text-center space-y-2">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary/10 text-primary">
            <Music className="h-7 w-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold">Prévia para {data.client_name}</h1>
          {data.project_title && (
            <p className="text-muted-foreground">{data.project_title}</p>
          )}
        </header>

        {data.status === 'approved' && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4 flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <div className="font-semibold text-green-900">Prévia aprovada</div>
                {data.reviewed_at && (
                  <div className="text-xs text-green-800">
                    em {new Date(data.reviewed_at).toLocaleString('pt-BR')}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {data.status === 'rejected' && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <div className="font-semibold text-red-900">Ajustes solicitados</div>
              </div>
              {data.client_comment && (
                <p className="text-sm text-red-900 whitespace-pre-wrap">{data.client_comment}</p>
              )}
            </CardContent>
          </Card>
        )}

        <section className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4" />Faixas
          </h2>
          {data.tracks.length === 0 ? (
            <Card><CardContent className="p-6 text-center text-muted-foreground">
              Nenhuma faixa disponível ainda.
            </CardContent></Card>
          ) : (
            data.tracks.map((t) => <TrackPlayer key={t.id} track={t} />)
          )}
        </section>

        {data.status === 'pending' && data.tracks.length > 0 && (
          <Card>
            <CardContent className="p-4 space-y-3">
              <div>
                <label className="text-sm font-semibold">Comentário (opcional para aprovar, obrigatório para recusar)</label>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Diga o que achou, peça ajustes..."
                  rows={3}
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => submitReview('rejected')} disabled={submitting}>
                  <XCircle className="h-4 w-4" />Pedir ajustes
                </Button>
                <Button onClick={() => submitReview('approved')} disabled={submitting}>
                  <CheckCircle2 className="h-4 w-4" />Aprovar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <footer className="text-center text-xs text-muted-foreground pt-4">
          <Lock className="inline h-3 w-3 mr-1" />
          Reprodução limitada. Download não permitido.
        </footer>
      </div>
    </div>
  );
};

export default PreviaPublica;
