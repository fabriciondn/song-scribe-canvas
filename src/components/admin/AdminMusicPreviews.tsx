import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Music, Plus, Copy, Trash2, Upload, ExternalLink, Loader2, CheckCircle2, XCircle, Clock, MapPin, Headphones,
} from 'lucide-react';

interface Preview {
  id: string;
  client_name: string;
  project_title: string | null;
  share_token: string;
  slug: string | null;
  status: string;
  client_comment: string | null;
  reviewed_at: string | null;
  created_at: string;
}

interface Track {
  id: string;
  preview_id: string;
  track_name: string;
  storage_path: string;
  preview_seconds: number;
  position: number;
}

export const AdminMusicPreviews: React.FC = () => {
  const [previews, setPreviews] = useState<Preview[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newDialog, setNewDialog] = useState(false);
  const [clientName, setClientName] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [selectedPreview, setSelectedPreview] = useState<Preview | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [tracksLoading, setTracksLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newTrackName, setNewTrackName] = useState('');
  const [newTrackSeconds, setNewTrackSeconds] = useState(30);
  const [listens, setListens] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('music_previews')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      toast.error('Erro ao carregar prévias');
    } else {
      setPreviews((data || []) as Preview[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    (async () => {
      try {
        await supabase.functions.invoke('ensure-music-previews-bucket');
      } catch (e) {
        console.error('bucket init', e);
      }
      load();
    })();
  }, []);

  const loadTracks = async (previewId: string) => {
    setTracksLoading(true);
    const { data, error } = await supabase
      .from('music_preview_tracks')
      .select('*')
      .eq('preview_id', previewId)
      .order('position', { ascending: true })
      .order('created_at', { ascending: true });
    if (error) toast.error('Erro ao carregar faixas');
    else setTracks((data || []) as Track[]);
    setTracksLoading(false);

    // listens
    const { data: ls } = await supabase
      .from('music_preview_listens')
      .select('*')
      .eq('preview_id', previewId)
      .order('created_at', { ascending: false })
      .limit(200);
    setListens(ls || []);

    // orders
    const { data: os } = await supabase
      .from('music_preview_orders')
      .select('*')
      .eq('preview_id', previewId)
      .order('created_at', { ascending: false });
    setOrders(os || []);
  };

  const createPreview = async () => {
    if (!clientName.trim()) {
      toast.error('Informe o nome do cliente');
      return;
    }
    setCreating(true);
    const { data: userData } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('music_previews')
      .insert({
        client_name: clientName.trim(),
        project_title: projectTitle.trim() || null,
        admin_user_id: userData.user!.id,
      })
      .select()
      .single();
    setCreating(false);
    if (error) {
      toast.error('Erro ao criar prévia');
      return;
    }
    setNewDialog(false);
    setClientName('');
    setProjectTitle('');
    toast.success('Prévia criada!');
    await load();
    setSelectedPreview(data as Preview);
    loadTracks((data as Preview).id);
  };

  const publicSlug = (p: Preview) => p.slug || p.share_token;

  const copyLink = (p: Preview) => {
    const url = `${window.location.origin}/${publicSlug(p)}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copiado!');
  };

  const openPublic = (p: Preview) => {
    window.open(`/${publicSlug(p)}`, '_blank');
  };

  const deletePreview = async (id: string) => {
    if (!confirm('Excluir esta prévia e todas as faixas?')) return;
    const { data: ts } = await supabase
      .from('music_preview_tracks')
      .select('storage_path')
      .eq('preview_id', id);
    if (ts && ts.length > 0) {
      await supabase.storage.from('music-previews').remove(ts.map((t: any) => t.storage_path));
    }
    const { error } = await supabase.from('music_previews').delete().eq('id', id);
    if (error) toast.error('Erro ao excluir');
    else {
      toast.success('Prévia excluída');
      if (selectedPreview?.id === id) setSelectedPreview(null);
      load();
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedPreview) return;
    if (!newTrackName.trim()) {
      toast.error('Informe o nome da faixa antes de selecionar o arquivo');
      e.target.value = '';
      return;
    }
    if (newTrackSeconds <= 0) {
      toast.error('Tempo de prévia inválido');
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'mp3';
      const path = `${selectedPreview.id}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('music-previews')
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;

      const { error: insErr } = await supabase.from('music_preview_tracks').insert({
        preview_id: selectedPreview.id,
        track_name: newTrackName.trim(),
        storage_path: path,
        preview_seconds: Number(newTrackSeconds),
        position: tracks.length,
      });
      if (insErr) throw insErr;

      setNewTrackName('');
      setNewTrackSeconds(30);
      toast.success('Faixa adicionada!');
      loadTracks(selectedPreview.id);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Erro no upload');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const deleteTrack = async (track: Track) => {
    if (!confirm('Remover esta faixa?')) return;
    await supabase.storage.from('music-previews').remove([track.storage_path]);
    const { error } = await supabase.from('music_preview_tracks').delete().eq('id', track.id);
    if (error) toast.error('Erro ao remover');
    else {
      toast.success('Faixa removida');
      if (selectedPreview) loadTracks(selectedPreview.id);
    }
  };

  const statusBadge = (status: string) => {
    if (status === 'approved')
      return <Badge className="bg-green-100 text-green-800 border-green-200 gap-1"><CheckCircle2 className="h-3 w-3" />Aprovada</Badge>;
    if (status === 'rejected')
      return <Badge className="bg-red-100 text-red-800 border-red-200 gap-1"><XCircle className="h-3 w-3" />Recusada</Badge>;
    return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />Aguardando</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Music className="h-6 w-6 text-primary" />
            Prévias para Clientes
          </h2>
          <p className="text-sm text-muted-foreground">
            Envie prévias de produção musical com tempo limitado de reprodução. Sem download.
          </p>
        </div>
        <Dialog open={newDialog} onOpenChange={setNewDialog}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4" />Nova Prévia</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova Prévia</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Nome do cliente *</Label>
                <Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Ex: João Silva" />
              </div>
              <div>
                <Label>Título do projeto (opcional)</Label>
                <Input value={projectTitle} onChange={(e) => setProjectTitle(e.target.value)} placeholder="Ex: Single Verão 2026" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setNewDialog(false)}>Cancelar</Button>
              <Button onClick={createPreview} disabled={creating}>
                {creating && <Loader2 className="h-4 w-4 animate-spin" />}Criar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 space-y-2">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : previews.length === 0 ? (
            <Card><CardContent className="p-6 text-center text-muted-foreground">Nenhuma prévia criada ainda.</CardContent></Card>
          ) : (
            previews.map((p) => (
              <Card
                key={p.id}
                className={`cursor-pointer transition ${selectedPreview?.id === p.id ? 'border-primary ring-1 ring-primary' : 'hover:border-primary/50'}`}
                onClick={() => { setSelectedPreview(p); loadTracks(p.id); }}
              >
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold truncate">{p.client_name}</div>
                      {p.project_title && <div className="text-xs text-muted-foreground truncate">{p.project_title}</div>}
                      <div className="mt-1">{statusBadge(p.status)}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div className="lg:col-span-2">
          {!selectedPreview ? (
            <Card><CardContent className="p-10 text-center text-muted-foreground">
              Selecione ou crie uma prévia para gerenciar faixas.
            </CardContent></Card>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <CardTitle>{selectedPreview.client_name}</CardTitle>
                    {selectedPreview.project_title && (
                      <p className="text-sm text-muted-foreground">{selectedPreview.project_title}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => copyLink(selectedPreview)}>
                      <Copy className="h-4 w-4" />Copiar link
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => openPublic(selectedPreview)}>
                      <ExternalLink className="h-4 w-4" />Abrir
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => deletePreview(selectedPreview.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border p-3 bg-muted/30">
                  <div className="text-xs text-muted-foreground mb-1">Link público:</div>
                  <div className="text-sm font-mono break-all">
                    {window.location.origin}/{publicSlug(selectedPreview)}
                  </div>
                </div>

                {selectedPreview.status !== 'pending' && (
                  <div className={`rounded-lg border p-3 ${selectedPreview.status === 'approved' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      {statusBadge(selectedPreview.status)}
                      {selectedPreview.reviewed_at && (
                        <span className="text-xs text-muted-foreground">
                          em {new Date(selectedPreview.reviewed_at).toLocaleString('pt-BR')}
                        </span>
                      )}
                    </div>
                    {selectedPreview.client_comment && (
                      <p className="text-sm whitespace-pre-wrap">{selectedPreview.client_comment}</p>
                    )}
                  </div>
                )}

                <div className="rounded-lg border p-3 space-y-3">
                  <div className="font-semibold flex items-center gap-2"><Upload className="h-4 w-4" />Adicionar faixa</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="sm:col-span-2">
                      <Label className="text-xs">Nome da faixa *</Label>
                      <Input value={newTrackName} onChange={(e) => setNewTrackName(e.target.value)} placeholder="Ex: Refrão final" />
                    </div>
                    <div>
                      <Label className="text-xs">Tempo (s) *</Label>
                      <Input type="number" min={1} max={600} value={newTrackSeconds}
                        onChange={(e) => setNewTrackSeconds(parseInt(e.target.value || '0', 10))} />
                    </div>
                  </div>
                  <input ref={fileInputRef} type="file" accept="audio/mpeg,audio/mp3,audio/wav,audio/*" className="hidden" onChange={handleFileSelect} />
                  <Button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="w-full">
                    {uploading ? <><Loader2 className="h-4 w-4 animate-spin" />Enviando...</> : <><Upload className="h-4 w-4" />Selecionar áudio MP3</>}
                  </Button>
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-semibold">Faixas ({tracks.length})</div>
                  {tracksLoading ? (
                    <div className="text-center py-4 text-muted-foreground text-sm">Carregando faixas...</div>
                  ) : tracks.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground text-sm">Nenhuma faixa enviada.</div>
                  ) : (
                    tracks.map((t) => (
                      <div key={t.id} className="flex items-center justify-between gap-2 p-2 rounded border">
                        <div className="min-w-0 flex-1">
                          <div className="font-medium truncate">{t.track_name}</div>
                          <div className="text-xs text-muted-foreground">Prévia: {t.preview_seconds}s</div>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => deleteTrack(t)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-semibold flex items-center gap-2">
                    <Headphones className="h-4 w-4" />Acessos ({listens.length})
                  </div>
                  {listens.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground text-sm">Ninguém ouviu ainda.</div>
                  ) : (
                    <div className="max-h-72 overflow-y-auto space-y-1 border rounded">
                      {listens.map((l) => {
                        const tk = tracks.find((t) => t.id === l.track_id);
                        return (
                          <div key={l.id} className="flex items-center justify-between gap-2 p-2 border-b last:border-b-0 text-xs">
                            <div className="min-w-0 flex-1">
                              <div className="font-medium truncate">{tk?.track_name || 'Faixa removida'}</div>
                              <div className="text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {[l.city, l.region, l.country].filter(Boolean).join(', ') || 'Local desconhecido'}
                                {l.ip_address && <span className="ml-1">· {l.ip_address}</span>}
                              </div>
                              <div className="text-muted-foreground">
                                {new Date(l.created_at).toLocaleString('pt-BR')}
                              </div>
                            </div>
                            <div className="font-mono text-sm font-semibold">{l.listened_seconds}s</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-semibold">Pedidos PIX ({orders.length})</div>
                  {orders.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground text-sm">Nenhum pedido gerado.</div>
                  ) : (
                    orders.map((o) => (
                      <div key={o.id} className="flex items-center justify-between gap-2 p-2 rounded border text-xs">
                        <div className="min-w-0 flex-1">
                          <div className="font-medium">R$ {Number(o.amount).toFixed(2).replace('.', ',')} · {o.selected_track_ids?.length || 0} faixa(s)</div>
                          <div className="text-muted-foreground">
                            {new Date(o.created_at).toLocaleString('pt-BR')}
                            {o.paid_at && ` · pago em ${new Date(o.paid_at).toLocaleString('pt-BR')}`}
                          </div>
                        </div>
                        <Badge className={o.status === 'paid' ? 'bg-green-100 text-green-800 border-green-200' : ''} variant={o.status === 'paid' ? 'default' : 'secondary'}>
                          {o.status === 'paid' ? 'Pago' : 'Aguardando'}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
