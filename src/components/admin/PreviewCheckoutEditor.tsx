import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  Loader2, Upload, Trash2, Plus, GripVertical, Image as ImageIcon,
  Palette, Type, ListOrdered, Sparkles, Save, X,
} from 'lucide-react';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, useSortable, verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  CheckoutConfig, DEFAULT_CONFIG, CustomTextBlock, BlockId,
  ensureOrderIntegrity, mergeConfig,
} from '@/lib/previewCheckoutConfig';
import { CheckoutRenderer } from '@/components/preview-checkout/CheckoutRenderer';
import { Card } from '@/components/ui/card';

export interface PreviewCheckoutEditorProps {
  open: boolean;
  onClose: () => void;
  /** null = editar template global; string = editar override da prévia */
  previewId: string | null;
  clientName: string;
  projectTitle?: string | null;
  onSaved?: () => void;
}

interface LoadedData {
  banner_url: string | null;
  config: CheckoutConfig;
}

const BLOCK_LABELS: Record<string, string> = {
  tracks: 'Faixas + botão PIX',
  bonus: 'Bônus (Playback grátis)',
  upsell: 'Oferta de Registro Autoral',
};

function SortableRow({
  id, label, onRemove,
}: { id: string; label: string; onRemove?: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };
  return (
    <div
      ref={setNodeRef} style={style}
      className="flex items-center gap-2 rounded-md border bg-card p-2"
    >
      <button
        type="button"
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground p-1"
        {...attributes} {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="flex-1 text-sm truncate">{label}</span>
      {onRemove && (
        <Button size="icon" variant="ghost" onClick={onRemove} title="Remover bloco">
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

export const PreviewCheckoutEditor: React.FC<PreviewCheckoutEditorProps> = ({
  open, onClose, previewId, clientName, projectTitle, onSaved,
}) => {
  const isGlobal = previewId === null;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [config, setConfig] = useState<CheckoutConfig>({});
  const [templateData, setTemplateData] = useState<LoadedData>({ banner_url: null, config: {} });
  const fileRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);
  const [uploadingCover, setUploadingCover] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  // Carregar dados
  useEffect(() => {
    if (!open) return;
    (async () => {
      setLoading(true);

      // sempre carrega o template global
      const { data: tpl } = await supabase.rpc('get_preview_checkout_template');
      const tplData: LoadedData = {
        banner_url: (tpl as any)?.banner_url ?? null,
        config: ((tpl as any)?.config ?? {}) as CheckoutConfig,
      };
      setTemplateData(tplData);

      if (isGlobal) {
        setBannerUrl(tplData.banner_url);
        setConfig(tplData.config);
      } else {
        const { data } = await supabase
          .from('music_previews')
          .select('banner_url, checkout_config')
          .eq('id', previewId!)
          .maybeSingle();
        setBannerUrl((data as any)?.banner_url ?? null);
        setConfig(((data as any)?.checkout_config ?? {}) as CheckoutConfig);
      }
      setLoading(false);
    })();
  }, [open, previewId, isGlobal]);

  const merged = useMemo(() => {
    if (isGlobal) return mergeConfig(null, config);
    return mergeConfig(templateData.config, config);
  }, [isGlobal, templateData.config, config]);

  const effectiveBanner = bannerUrl ?? (isGlobal ? null : templateData.banner_url);

  const setCfg = (patch: Partial<CheckoutConfig>) =>
    setConfig((c) => ({ ...c, ...patch }));

  const orderIds: BlockId[] = ensureOrderIntegrity(
    (config.order ?? templateData.config.order ?? DEFAULT_CONFIG.order) as BlockId[],
    (config.customBlocks ?? templateData.config.customBlocks ?? []) as CustomTextBlock[],
  );

  const customBlocks: CustomTextBlock[] =
    (config.customBlocks ?? templateData.config.customBlocks ?? []) as CustomTextBlock[];

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = orderIds.indexOf(active.id as BlockId);
    const newIndex = orderIds.indexOf(over.id as BlockId);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(orderIds, oldIndex, newIndex);
    setCfg({ order: next });
  };

  const addCustomBlock = () => {
    const id = `b${Date.now().toString(36)}`;
    const nb: CustomTextBlock = {
      id,
      title: 'Novo bloco',
      text: 'Texto do bloco',
      variant: 'highlight',
    };
    const next = [...customBlocks, nb];
    setCfg({
      customBlocks: next,
      order: ensureOrderIntegrity([...orderIds, `custom:${id}` as BlockId], next),
    });
  };

  const removeCustomBlock = (id: string) => {
    const next = customBlocks.filter((b) => b.id !== id);
    setCfg({
      customBlocks: next,
      order: orderIds.filter((o) => o !== `custom:${id}`),
    });
  };

  const updateCustomBlock = (id: string, patch: Partial<CustomTextBlock>) => {
    setCfg({
      customBlocks: customBlocks.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    });
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/^image\//.test(file.type)) {
      toast.error('Envie uma imagem');
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const key = isGlobal ? 'global' : previewId;
      const path = `${key}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('preview-banners')
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;
      const { data: signed, error: sErr } = await supabase.storage
        .from('preview-banners').createSignedUrl(path, 60 * 60 * 24 * 365 * 10); // 10 anos
      if (sErr) throw sErr;
      setBannerUrl(signed.signedUrl);
      toast.success('Imagem enviada');
    } catch (err: any) {
      toast.error(err.message || 'Erro no upload');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const clearBanner = () => setBannerUrl(null);

  const uploadCoverFile = async (file: File): Promise<string> => {
    const ext = file.name.split('.').pop() || 'jpg';
    const key = isGlobal ? 'global' : previewId;
    const path = `${key}/cover-${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from('preview-banners')
      .upload(path, file, { contentType: file.type, upsert: false });
    if (upErr) throw upErr;
    const { data: signed, error: sErr } = await supabase.storage
      .from('preview-banners').createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
    if (sErr) throw sErr;
    return signed.signedUrl;
  };

  const handleCoverFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const invalid = files.find((f) => !/^image\//.test(f.type));
    if (invalid) { toast.error('Envie apenas imagens'); return; }
    setUploadingCover(true);
    try {
      const urls: string[] = [];
      for (const f of files) urls.push(await uploadCoverFile(f));
      const coverType = (config.coverType ?? templateData.config.coverType ?? 'single') as 'single' | 'slide';
      if (coverType === 'slide') {
        const existing = (config.coverUrls ?? templateData.config.coverUrls ?? []) as string[];
        setCfg({ coverUrls: [...existing, ...urls] });
      } else {
        // single: usa a primeira
        setCfg({ coverUrl: urls[0] });
      }
      toast.success(files.length > 1 ? `${files.length} capas enviadas` : 'Capa enviada');
    } catch (err: any) {
      toast.error(err.message || 'Erro no upload');
    } finally {
      setUploadingCover(false);
      if (coverRef.current) coverRef.current.value = '';
    }
  };

  const clearCover = () => setCfg({ coverUrl: undefined });
  const removeSlideCover = (url: string) => {
    const existing = (config.coverUrls ?? templateData.config.coverUrls ?? []) as string[];
    setCfg({ coverUrls: existing.filter((u) => u !== url) });
  };

  const resetToTemplate = () => {
    if (isGlobal) return;
    setBannerUrl(null);
    setConfig({});
    toast.info('Voltando ao template global');
  };

  const save = async () => {
    setSaving(true);
    try {
      if (isGlobal) {
        // upsert singleton
        const { data: userData } = await supabase.auth.getUser();
        const { error } = await supabase
          .from('preview_checkout_template')
          .upsert(
            {
              scope: 'global',
              banner_url: bannerUrl,
              config: config as any,
              updated_by: userData.user?.id ?? null,
            },
            { onConflict: 'scope' },
          );
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('music_previews')
          .update({
            banner_url: bannerUrl,
            checkout_config: config as any,
          })
          .eq('id', previewId!);
        if (error) throw error;
      }
      toast.success('Checkout salvo!');
      onSaved?.();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  // slots visuais fake para o preview (sem lógica real de compra)
  const previewSlots = {
    tracks: (
      <Card className="p-4 space-y-3 bg-slate-50 border-slate-200 text-slate-900">
        <div className="text-sm opacity-80">Selecione as faixas que deseja liberar para download</div>
        <div className="space-y-2">
          {['Faixa 1', 'Faixa 2'].map((n) => (
            <div key={n} className="flex items-center gap-2 p-2 rounded border border-slate-200 bg-white">
              <div className="h-4 w-4 rounded border border-slate-300" />
              <span className="text-sm">{n}</span>
            </div>
          ))}
        </div>
        <div className="text-center text-sm opacity-70">
          Total: <span className="font-bold text-base" style={{ color: merged.primary ?? '#22c55e' }}>R$ 49,99</span>
        </div>
        <button
          type="button"
          className="w-full h-10 rounded-md font-semibold text-white"
          style={{ backgroundColor: merged.primary ?? '#22c55e' }}
        >
          {merged.ctaLabel}
        </button>
      </Card>
    ),
    bonus: merged.bonusEnabled ? (
      <div className="rounded-xl border border-green-500/40 bg-green-500/10 p-3 text-sm flex items-start gap-2">
        <span className="text-lg leading-none">🎁</span>
        <div>
          <div className="font-semibold">{merged.bonusTitle}</div>
          <div className="text-xs opacity-90">{merged.bonusText}</div>
        </div>
      </div>
    ) : null,
    upsell: merged.upsellEnabled ? (
      <div
        className="block p-4 rounded-xl border-2 border-dashed"
        style={{ borderColor: `${merged.primary}66`, backgroundColor: `${merged.primary}0d` }}
      >
        <div className="flex items-start gap-3">
          <div className="mt-1 h-4 w-4 rounded border border-white/40" />
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded text-white"
                style={{ backgroundColor: merged.primary }}
              >{merged.upsellBadge}</span>
              {merged.upsellOldPriceLabel && (
                <span className="text-xs opacity-60 line-through">{merged.upsellOldPriceLabel}</span>
              )}
              <span className="text-base font-bold" style={{ color: merged.primary }}>{merged.upsellPriceLabel}</span>
            </div>
            <div className="font-semibold text-sm">{merged.upsellTitle}</div>
            <div className="text-sm opacity-90">{merged.upsellText}</div>
          </div>
        </div>
      </div>
    ) : null,
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-6xl w-[95vw] h-[90vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="p-4 pb-3 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {isGlobal ? 'Editar checkout — Template Global' : `Editar checkout — ${clientName}`}
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            {isGlobal
              ? 'Este template é aplicado a todas as prévias que não tenham personalização própria.'
              : 'Personalização exclusiva desta prévia. Campos em branco herdam do template global.'}
          </p>
        </DialogHeader>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="flex-1 grid md:grid-cols-2 min-h-0">
            {/* Painel esquerdo: editor */}
            <div className="overflow-y-auto p-4 space-y-6 border-r">
              {/* Banner */}
              <section className="space-y-2">
                <div className="text-sm font-semibold flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />Banner
                </div>
                {effectiveBanner ? (
                  <div className="relative rounded-lg overflow-hidden border">
                    <img src={effectiveBanner} className="w-full h-40 object-cover" alt="Banner" />
                    <div className="absolute top-2 right-2 flex gap-1">
                      <Button size="sm" variant="secondary" onClick={() => fileRef.current?.click()}>
                        <Upload className="h-3 w-3" />Trocar
                      </Button>
                      <Button size="sm" variant="destructive" onClick={clearBanner}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button variant="outline" className="w-full h-24 border-dashed"
                    onClick={() => fileRef.current?.click()} disabled={uploading}>
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    Enviar imagem de banner (retangular)
                  </Button>
                )}
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
              </section>

              {/* Capa quadrada 1x1 */}
              <section className="space-y-2">
                <div className="text-sm font-semibold flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />Capa da música (quadrada 1:1)
                </div>
                <p className="text-xs text-muted-foreground">
                  Imagem quadrada exibida acima do título. Ideal: 800x800px.
                </p>

                {/* Toggle single/slide */}
                <div className="inline-flex rounded-md border overflow-hidden">
                  {(['single', 'slide'] as const).map((t) => {
                    const active = (merged.coverType ?? 'single') === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setCfg({ coverType: t })}
                        className={`px-3 h-8 text-xs font-medium transition ${
                          active ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'
                        }`}
                      >
                        {t === 'single' ? 'Imagem única' : 'Slide (várias)'}
                      </button>
                    );
                  })}
                </div>

                {(merged.coverType ?? 'single') === 'single' ? (
                  merged.coverUrl ? (
                    <div className="relative w-40 h-40 rounded-lg overflow-hidden border">
                      <img src={merged.coverUrl} className="w-full h-full object-cover" alt="Capa" />
                      <div className="absolute top-1 right-1 flex gap-1">
                        <Button size="sm" variant="secondary" onClick={() => coverRef.current?.click()}>
                          <Upload className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={clearCover}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button variant="outline" className="w-40 h-40 border-dashed flex-col"
                      onClick={() => coverRef.current?.click()} disabled={uploadingCover}>
                      {uploadingCover ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      <span className="text-xs mt-1">Enviar capa 1:1</span>
                    </Button>
                  )
                ) : (
                  <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      {(merged.coverUrls || []).map((url) => (
                        <div key={url} className="relative aspect-square rounded-lg overflow-hidden border group">
                          <img src={url} className="w-full h-full object-cover" alt="Capa" />
                          <button
                            type="button"
                            onClick={() => removeSlideCover(url)}
                            className="absolute top-1 right-1 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                            title="Remover"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      <Button variant="outline" className="aspect-square border-dashed h-auto flex-col"
                        onClick={() => coverRef.current?.click()} disabled={uploadingCover}>
                        {uploadingCover ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                        <span className="text-[10px] mt-1">Adicionar</span>
                      </Button>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Você pode selecionar várias imagens de uma vez. Elas serão exibidas em carrossel automático.
                    </p>
                  </div>
                )}

                <input
                  ref={coverRef}
                  type="file"
                  accept="image/*"
                  multiple={(merged.coverType ?? 'single') === 'slide'}
                  className="hidden"
                  onChange={handleCoverFile}
                />
              </section>

              {/* Cores */}
              <section className="space-y-2">
                <div className="text-sm font-semibold flex items-center gap-2">
                  <Palette className="h-4 w-4" />Cores
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'primary', label: 'Primária', fallback: '#22c55e' },
                    { key: 'bg', label: 'Fundo', fallback: '#ffffff' },
                    { key: 'fg', label: 'Texto', fallback: '#0a0a0a' },
                  ].map((c) => (
                    <div key={c.key}>
                      <Label className="text-xs">{c.label}</Label>
                      <div className="flex items-center gap-1">
                        <input
                          type="color"
                          className="h-9 w-10 rounded border cursor-pointer bg-transparent"
                          value={(config as any)[c.key] ?? (templateData.config as any)[c.key] ?? c.fallback}
                          onChange={(e) => setCfg({ [c.key]: e.target.value } as any)}
                        />
                        <Input
                          className="h-9 flex-1 text-xs font-mono"
                          value={(config as any)[c.key] ?? ''}
                          onChange={(e) => setCfg({ [c.key]: e.target.value } as any)}
                          placeholder={(templateData.config as any)[c.key] ?? 'padrão do tema'}
                        />

                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Textos principais */}
              <section className="space-y-2">
                <div className="text-sm font-semibold flex items-center gap-2">
                  <Type className="h-4 w-4" />Textos
                </div>
                <div>
                  <Label className="text-xs">Título ({'{client_name}'} e {'{project_title}'} são substituídos)</Label>
                  <Input value={config.headline ?? ''} placeholder={merged.headline}
                    onChange={(e) => setCfg({ headline: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Subtítulo</Label>
                  <Input value={config.subheadline ?? ''} placeholder={merged.subheadline}
                    onChange={(e) => setCfg({ subheadline: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Texto do botão principal</Label>
                  <Input value={config.ctaLabel ?? ''} placeholder={merged.ctaLabel}
                    onChange={(e) => setCfg({ ctaLabel: e.target.value })} />
                </div>
              </section>

              {/* Bônus */}
              <section className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">Bloco: Bônus grátis</div>
                  <Switch
                    checked={merged.bonusEnabled}
                    onCheckedChange={(v) => setCfg({ bonusEnabled: v })}
                  />
                </div>
                {merged.bonusEnabled && (
                  <div className="space-y-2 pl-2 border-l-2 border-primary/30">
                    <Input value={config.bonusTitle ?? ''} placeholder={merged.bonusTitle}
                      onChange={(e) => setCfg({ bonusTitle: e.target.value })} />
                    <Textarea rows={2} value={config.bonusText ?? ''} placeholder={merged.bonusText}
                      onChange={(e) => setCfg({ bonusText: e.target.value })} />
                  </div>
                )}
              </section>

              {/* Upsell */}
              <section className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">Bloco: Oferta de Registro</div>
                  <Switch
                    checked={merged.upsellEnabled}
                    onCheckedChange={(v) => setCfg({ upsellEnabled: v })}
                  />
                </div>
                {merged.upsellEnabled && (
                  <div className="space-y-2 pl-2 border-l-2 border-primary/30">
                    <Input value={config.upsellBadge ?? ''} placeholder={merged.upsellBadge}
                      onChange={(e) => setCfg({ upsellBadge: e.target.value })} />
                    <Input value={config.upsellTitle ?? ''} placeholder={merged.upsellTitle}
                      onChange={(e) => setCfg({ upsellTitle: e.target.value })} />
                    <Textarea rows={2} value={config.upsellText ?? ''} placeholder={merged.upsellText}
                      onChange={(e) => setCfg({ upsellText: e.target.value })} />
                    <div className="grid grid-cols-2 gap-2">
                      <Input value={config.upsellOldPriceLabel ?? ''} placeholder={merged.upsellOldPriceLabel}
                        onChange={(e) => setCfg({ upsellOldPriceLabel: e.target.value })} />
                      <Input value={config.upsellPriceLabel ?? ''} placeholder={merged.upsellPriceLabel}
                        onChange={(e) => setCfg({ upsellPriceLabel: e.target.value })} />
                    </div>
                  </div>
                )}
              </section>

              {/* Order-bump: Capa personalizada */}
              <section className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">Bump: Capa personalizada (+R$ 4,99)</div>
                  <Switch
                    checked={merged.coverBumpEnabled}
                    onCheckedChange={(v) => setCfg({ coverBumpEnabled: v })}
                  />
                </div>
                {merged.coverBumpEnabled && (
                  <div className="space-y-2 pl-2 border-l-2 border-primary/30">
                    <p className="text-xs text-muted-foreground">
                      Aparece no checkout como opção adicional. O cliente escolhe uma das capas cadastradas acima (single ou slideshow) e paga R$ 4,99 a mais.
                    </p>
                    <Input value={config.coverBumpBadge ?? ''} placeholder={merged.coverBumpBadge}
                      onChange={(e) => setCfg({ coverBumpBadge: e.target.value })} />
                    <Input value={config.coverBumpTitle ?? ''} placeholder={merged.coverBumpTitle}
                      onChange={(e) => setCfg({ coverBumpTitle: e.target.value })} />
                    <Textarea rows={2} value={config.coverBumpText ?? ''} placeholder={merged.coverBumpText}
                      onChange={(e) => setCfg({ coverBumpText: e.target.value })} />
                  </div>
                )}

              {/* Blocos customizados */}
              <section className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">Blocos de texto extras</div>
                  <Button size="sm" variant="outline" onClick={addCustomBlock}>
                    <Plus className="h-3 w-3" />Adicionar
                  </Button>
                </div>
                {customBlocks.length === 0 && (
                  <p className="text-xs text-muted-foreground">Nenhum bloco extra.</p>
                )}
                {customBlocks.map((b) => (
                  <div key={b.id} className="rounded-md border p-2 space-y-2 bg-muted/30">
                    <div className="flex items-center gap-2">
                      <Input value={b.title ?? ''} placeholder="Título"
                        onChange={(e) => updateCustomBlock(b.id, { title: e.target.value })} />
                      <select
                        className="h-9 rounded-md border bg-background px-2 text-xs"
                        value={b.variant ?? 'default'}
                        onChange={(e) => updateCustomBlock(b.id, { variant: e.target.value as any })}
                      >
                        <option value="default">Neutro</option>
                        <option value="highlight">Destaque</option>
                        <option value="success">Sucesso</option>
                        <option value="warning">Atenção</option>
                      </select>
                      <Button size="icon" variant="ghost" onClick={() => removeCustomBlock(b.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <Textarea rows={2} value={b.text ?? ''} placeholder="Conteúdo"
                      onChange={(e) => updateCustomBlock(b.id, { text: e.target.value })} />
                  </div>
                ))}
              </section>

              {/* Ordenação */}
              <section className="space-y-2">
                <div className="text-sm font-semibold flex items-center gap-2">
                  <ListOrdered className="h-4 w-4" />Ordem dos blocos (arraste)
                </div>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={orderIds} strategy={verticalListSortingStrategy}>
                    <div className="space-y-1">
                      {orderIds.map((id) => {
                        let label = BLOCK_LABELS[id] || id;
                        if (id.startsWith('custom:')) {
                          const cid = id.slice('custom:'.length);
                          const cb = customBlocks.find((c) => c.id === cid);
                          label = `📝 ${cb?.title || 'Bloco extra'}`;
                        }
                        return <SortableRow key={id} id={id} label={label} />;
                      })}
                    </div>
                  </SortableContext>
                </DndContext>
              </section>

              {!isGlobal && (
                <Button variant="outline" className="w-full" onClick={resetToTemplate}>
                  Resetar para o template global
                </Button>
              )}
            </div>

            {/* Painel direito: preview ao vivo */}
            <div className="overflow-y-auto bg-muted/30">
              <div className="p-3 text-xs text-muted-foreground text-center border-b bg-background sticky top-0 z-10">
                Preview ao vivo
              </div>
              <CheckoutRenderer
                clientName={clientName || 'Cliente'}
                projectTitle={projectTitle}
                bannerUrl={effectiveBanner}
                config={merged}
                slots={previewSlots}
              />
            </div>
          </div>
        )}

        <div className="border-t p-3 flex justify-end gap-2 shrink-0 bg-background">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button onClick={save} disabled={saving || loading}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
