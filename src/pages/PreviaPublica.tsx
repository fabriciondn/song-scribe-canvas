import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import {
  Music, Play, Pause, CheckCircle2, XCircle, Clock, Loader2, Lock, Download, QrCode, Copy,
} from 'lucide-react';
import { getGeoLocation } from '@/services/realtimePresenceService';

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

let cachedGeo: { city?: string; region?: string; country?: string; ip?: string } | null = null;
async function getGeo() {
  if (cachedGeo) return cachedGeo;
  try {
    const r = await fetch('https://ipapi.co/json/');
    if (r.ok) {
      const d = await r.json();
      cachedGeo = { city: d.city, region: d.region, country: d.country_name, ip: d.ip };
      return cachedGeo;
    }
  } catch {}
  cachedGeo = await getGeoLocation();
  return cachedGeo;
}

const TrackPlayer: React.FC<{ track: Track; token: string }> = ({ track, token }) => {
  const [url, setUrl] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const sessionStart = useRef<number>(0);
  const sessionMax = useRef<number>(0);

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

  const logListen = async (seconds: number) => {
    if (seconds <= 0) return;
    const geo = await getGeo();
    await supabase.rpc('log_music_preview_listen', {
      p_token: token,
      p_track_id: track.id,
      p_seconds: Math.round(seconds),
      p_ip: geo?.ip ?? null,
      p_city: geo?.city ?? null,
      p_region: geo?.region ?? null,
      p_country: geo?.country ?? null,
    });
  };

  const toggle = async () => {
    const a = audioRef.current;
    if (!a) {
      const u = await ensureUrl();
      if (!u) return;
      setTimeout(() => audioRef.current?.play(), 50);
      return;
    }
    if (playing) a.pause();
    else {
      if (!url) await ensureUrl();
      a.play();
    }
  };

  const onTimeUpdate = () => {
    const a = audioRef.current;
    if (!a) return;
    sessionMax.current = Math.max(sessionMax.current, a.currentTime);
    if (a.currentTime >= track.preview_seconds) {
      a.pause();
      a.currentTime = 0;
      setProgress(0);
      setPlaying(false);
      logListen(sessionMax.current);
      sessionMax.current = 0;
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
          onPlay={() => { setPlaying(true); sessionStart.current = Date.now(); }}
          onPause={() => {
            setPlaying(false);
            if (sessionMax.current > 0) {
              logListen(sessionMax.current);
              sessionMax.current = 0;
            }
          }}
          onEnded={() => { setPlaying(false); setProgress(0); }}
          onTimeUpdate={onTimeUpdate}
        />
      )}
    </div>
  );
};

interface OrderState {
  id: string;
  status: string;
  amount: number;
  pix_qr_code?: string;
  pix_br_code?: string;
  payment_url?: string;
  selected_track_ids: string[];
  tracks: { id: string; track_name: string; storage_path: string }[];
}

const PurchaseFlow: React.FC<{ preview: PreviewData; token: string }> = ({ preview, token }) => {
  const [selected, setSelected] = useState<string[]>(preview.tracks.map(t => t.id));
  const [order, setOrder] = useState<OrderState | null>(null);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [downloads, setDownloads] = useState<Record<string, string>>({});

  const toggle = (id: string) =>
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  const startOrder = async () => {
    if (selected.length === 0) {
      toast.error('Selecione ao menos uma faixa');
      return;
    }
    setCreatingOrder(true);
    const { data: res, error } = await supabase.rpc('create_music_preview_order', {
      p_token: token,
      p_track_ids: selected,
    });
    if (error || !(res as any)?.success) {
      setCreatingOrder(false);
      toast.error('Erro ao iniciar pedido');
      return;
    }
    const orderId = (res as any).order_id;
    const { data: pix, error: pixErr } = await supabase.functions.invoke('create-preview-pix', {
      body: { order_id: orderId, client_name: preview.client_name },
    });
    setCreatingOrder(false);
    if (pixErr || !pix?.success) {
      toast.error('Erro ao gerar PIX');
      return;
    }
    const { data: full } = await supabase.rpc('get_music_preview_order', { p_order_id: orderId });
    setOrder(full as unknown as OrderState);
  };

  // Poll order status
  useEffect(() => {
    if (!order || order.status === 'paid') return;
    const i = setInterval(async () => {
      const { data } = await supabase.rpc('get_music_preview_order', { p_order_id: order.id });
      if (data) {
        const o = data as unknown as OrderState;
        setOrder(o);
        if (o.status === 'paid') clearInterval(i);
      }
    }, 4000);
    return () => clearInterval(i);
  }, [order?.id, order?.status]);

  // When paid, generate signed download URLs
  useEffect(() => {
    if (order?.status !== 'paid') return;
    (async () => {
      const out: Record<string, string> = {};
      for (const t of order.tracks) {
        const { data } = await supabase.storage
          .from('music-previews')
          .createSignedUrl(t.storage_path, 60 * 60, { download: true });
        if (data?.signedUrl) out[t.id] = data.signedUrl;
      }
      setDownloads(out);
    })();
  }, [order?.status]);

  if (order?.status === 'paid') {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2 text-green-900 font-semibold">
            <CheckCircle2 className="h-5 w-5" /> Pagamento confirmado! Baixe suas faixas:
          </div>
          {order.tracks.map(t => (
            <a key={t.id} href={downloads[t.id]} download
              className="flex items-center justify-between gap-2 p-3 rounded border bg-white">
              <span className="font-medium truncate">{t.track_name}</span>
              <Button size="sm" disabled={!downloads[t.id]}>
                <Download className="h-4 w-4" />Baixar
              </Button>
            </a>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (order) {
    return (
      <Card>
        <CardContent className="p-4 space-y-3 text-center">
          <div className="font-semibold flex items-center justify-center gap-2">
            <QrCode className="h-5 w-5" /> Pague R$ {Number(order.amount).toFixed(2).replace('.', ',')} via PIX
          </div>
          {order.pix_qr_code && (
            <img src={order.pix_qr_code} alt="QR Code PIX" className="mx-auto w-56 h-56" />
          )}
          {order.pix_br_code && (
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">Ou copie o código PIX:</div>
              <div className="text-xs font-mono break-all p-2 bg-muted rounded">{order.pix_br_code}</div>
              <Button size="sm" variant="outline" onClick={() => {
                navigator.clipboard.writeText(order.pix_br_code!);
                toast.success('Código copiado');
              }}><Copy className="h-4 w-4" />Copiar</Button>
            </div>
          )}
          <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" /> Aguardando pagamento...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="font-semibold">Selecione as faixas que deseja liberar para download</div>
        <div className="space-y-2">
          {preview.tracks.map(t => (
            <label key={t.id} className="flex items-center gap-3 p-2 rounded border cursor-pointer hover:bg-muted/30">
              <Checkbox checked={selected.includes(t.id)} onCheckedChange={() => toggle(t.id)} />
              <span className="flex-1 font-medium">{t.track_name}</span>
            </label>
          ))}
        </div>
        <div className="text-center text-sm text-muted-foreground">
          Valor único: <span className="font-bold text-foreground">R$ 49,99</span>
        </div>
        <Button className="w-full" onClick={startOrder} disabled={creatingOrder || selected.length === 0}>
          {creatingOrder ? <Loader2 className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />}
          Gerar PIX e liberar download
        </Button>
      </CardContent>
    </Card>
  );
};

const PreviaPublica: React.FC = () => {
  const params = useParams<{ token?: string; slug?: string }>();
  const token = (params.token || params.slug) as string;
  const [data, setData] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data: res, error } = await supabase.rpc('get_music_preview_by_token', { p_token: token });
    setLoading(false);
    if (error || !res) { setData(null); return; }
    setData(res as unknown as PreviewData);
  };

  useEffect(() => {
    load();
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
      p_token: token, p_status: status, p_comment: comment.trim() || null,
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
            <p className="text-muted-foreground text-sm">Esta prévia não existe ou foi removida.</p>
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
          {data.project_title && (<p className="text-muted-foreground">{data.project_title}</p>)}
        </header>

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
            data.tracks.map((t) => <TrackPlayer key={t.id} track={t} token={token} />)
          )}
        </section>

        {data.status === 'pending' && data.tracks.length > 0 && (
          <Card>
            <CardContent className="p-4 space-y-3">
              <div>
                <label className="text-sm font-semibold">Comentário (opcional para aprovar, obrigatório para recusar)</label>
                <Textarea value={comment} onChange={(e) => setComment(e.target.value)}
                  placeholder="Diga o que achou, peça ajustes..." rows={3} className="mt-1" />
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

        {data.status === 'approved' && data.tracks.length > 0 && (
          <PurchaseFlow preview={data} token={token} />
        )}

        <footer className="text-center text-xs text-muted-foreground pt-4">
          <Lock className="inline h-3 w-3 mr-1" />
          Reprodução limitada nas prévias. Download apenas após pagamento.
        </footer>
      </div>
    </div>
  );
};

export default PreviaPublica;
