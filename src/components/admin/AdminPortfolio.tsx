import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Trash2, Upload, Plus, Save } from "lucide-react";

const sb = supabase as any;
const BUCKET = "public-assets";
const PREFIX = "portfolio";

type Work = {
  id: string;
  composer_name: string;
  composer_photo_url: string | null;
  style: string | null;
  audio_before_url: string | null;
  audio_after_url: string | null;
  display_order: number;
  is_active: boolean;
};
type Testimonial = {
  id: string;
  name: string;
  photo_url: string | null;
  audio_url: string;
  display_order: number;
  is_active: boolean;
};

async function uploadFile(file: File): Promise<string | null> {
  const ext = file.name.split(".").pop();
  const path = `${PREFIX}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true });
  if (error) {
    toast.error("Falha no upload: " + error.message);
    return null;
  }
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

const FileButton: React.FC<{
  accept: string;
  label: string;
  value?: string | null;
  onChange: (url: string) => void;
}> = ({ accept, label, value, onChange }) => {
  const [busy, setBusy] = useState(false);
  return (
    <div className="flex items-center gap-2">
      <label className="flex-1">
        <input
          type="file"
          accept={accept}
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            setBusy(true);
            const url = await uploadFile(f);
            setBusy(false);
            if (url) {
              onChange(url);
              toast.success("Upload concluído");
            }
            e.target.value = "";
          }}
        />
        <div className="cursor-pointer inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted">
          <Upload className="h-4 w-4" /> {busy ? "Enviando..." : label}
        </div>
      </label>
      {value && (
        <a href={value} target="_blank" rel="noreferrer" className="text-xs text-primary underline truncate max-w-[180px]">
          ver
        </a>
      )}
    </div>
  );
};

const WorksTab: React.FC = () => {
  const [items, setItems] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await sb.from("portfolio_works").select("*").order("display_order");
    setItems(data || []);
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const addNew = async () => {
    const { data, error } = await sb
      .from("portfolio_works")
      .insert({ composer_name: "Novo compositor", display_order: items.length })
      .select()
      .single();
    if (error) return toast.error(error.message);
    setItems((p) => [...p, data]);
  };

  const update = (id: string, patch: Partial<Work>) =>
    setItems((p) => p.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  const save = async (item: Work) => {
    const { error } = await sb.from("portfolio_works").update(item).eq("id", item.id);
    if (error) return toast.error(error.message);
    toast.success("Salvo");
  };

  const remove = async (id: string) => {
    if (!confirm("Remover este trabalho?")) return;
    await sb.from("portfolio_works").delete().eq("id", id);
    setItems((p) => p.filter((i) => i.id !== id));
  };

  if (loading) return <p>Carregando...</p>;

  return (
    <div className="space-y-4">
      <Button onClick={addNew}>
        <Plus className="h-4 w-4 mr-2" /> Novo trabalho
      </Button>
      {items.map((it) => (
        <Card key={it.id}>
          <CardContent className="p-4 space-y-3">
            <div className="grid md:grid-cols-3 gap-3">
              <div>
                <Label>Compositor</Label>
                <Input value={it.composer_name} onChange={(e) => update(it.id, { composer_name: e.target.value })} />
              </div>
              <div>
                <Label>Estilo</Label>
                <Input value={it.style || ""} onChange={(e) => update(it.id, { style: e.target.value })} />
              </div>
              <div>
                <Label>Ordem</Label>
                <Input
                  type="number"
                  value={it.display_order}
                  onChange={(e) => update(it.id, { display_order: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-3">
              <div>
                <Label>Foto do compositor</Label>
                <FileButton
                  accept="image/*"
                  label="Enviar foto"
                  value={it.composer_photo_url}
                  onChange={(url) => update(it.id, { composer_photo_url: url })}
                />
              </div>
              <div>
                <Label>Áudio Antes</Label>
                <FileButton
                  accept="audio/*"
                  label="Enviar áudio antes"
                  value={it.audio_before_url}
                  onChange={(url) => update(it.id, { audio_before_url: url })}
                />
              </div>
              <div>
                <Label>Áudio Depois</Label>
                <FileButton
                  accept="audio/*"
                  label="Enviar áudio depois"
                  value={it.audio_after_url}
                  onChange={(url) => update(it.id, { audio_after_url: url })}
                />
              </div>
            </div>
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <Switch checked={it.is_active} onCheckedChange={(v) => update(it.id, { is_active: v })} />
                <span className="text-sm">{it.is_active ? "Ativo" : "Oculto"}</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => save(it)}>
                  <Save className="h-4 w-4 mr-1" /> Salvar
                </Button>
                <Button variant="destructive" size="sm" onClick={() => remove(it.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

const TestimonialsTab: React.FC = () => {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await sb.from("portfolio_testimonials").select("*").order("display_order");
    setItems(data || []);
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const addNew = async () => {
    const { data, error } = await sb
      .from("portfolio_testimonials")
      .insert({ name: "Novo cliente", audio_url: "", display_order: items.length })
      .select()
      .single();
    if (error) return toast.error(error.message);
    setItems((p) => [...p, data]);
  };
  const update = (id: string, patch: Partial<Testimonial>) =>
    setItems((p) => p.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  const save = async (item: Testimonial) => {
    const { error } = await sb.from("portfolio_testimonials").update(item).eq("id", item.id);
    if (error) return toast.error(error.message);
    toast.success("Salvo");
  };
  const remove = async (id: string) => {
    if (!confirm("Remover?")) return;
    await sb.from("portfolio_testimonials").delete().eq("id", id);
    setItems((p) => p.filter((i) => i.id !== id));
  };

  if (loading) return <p>Carregando...</p>;
  return (
    <div className="space-y-4">
      <Button onClick={addNew}>
        <Plus className="h-4 w-4 mr-2" /> Novo depoimento
      </Button>
      {items.map((it) => (
        <Card key={it.id}>
          <CardContent className="p-4 space-y-3">
            <div className="grid md:grid-cols-3 gap-3">
              <div>
                <Label>Nome</Label>
                <Input value={it.name} onChange={(e) => update(it.id, { name: e.target.value })} />
              </div>
              <div>
                <Label>Foto</Label>
                <FileButton
                  accept="image/*"
                  label="Enviar foto"
                  value={it.photo_url}
                  onChange={(url) => update(it.id, { photo_url: url })}
                />
              </div>
              <div>
                <Label>Áudio</Label>
                <FileButton
                  accept="audio/*"
                  label="Enviar áudio"
                  value={it.audio_url}
                  onChange={(url) => update(it.id, { audio_url: url })}
                />
              </div>
            </div>
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <Switch checked={it.is_active} onCheckedChange={(v) => update(it.id, { is_active: v })} />
                <span className="text-sm">{it.is_active ? "Ativo" : "Oculto"}</span>
                <Input
                  type="number"
                  className="w-20 ml-4"
                  value={it.display_order}
                  onChange={(e) => update(it.id, { display_order: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => save(it)}>
                  <Save className="h-4 w-4 mr-1" /> Salvar
                </Button>
                <Button variant="destructive" size="sm" onClick={() => remove(it.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

const SETTING_KEYS: { key: string; label: string }[] = [
  { key: "hero_title", label: "Título principal" },
  { key: "hero_subtitle", label: "Subtítulo" },
  { key: "whatsapp_number", label: "WhatsApp (com DDI, ex 5511999999999)" },
  { key: "whatsapp_message", label: "Mensagem pré-preenchida do WhatsApp" },
  { key: "stat_1_value", label: "Stat 1 — valor" },
  { key: "stat_1_label", label: "Stat 1 — descrição" },
  { key: "stat_2_value", label: "Stat 2 — valor" },
  { key: "stat_2_label", label: "Stat 2 — descrição" },
  { key: "stat_3_value", label: "Stat 3 — valor" },
  { key: "stat_3_label", label: "Stat 3 — descrição" },
];

const SettingsTab: React.FC = () => {
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await sb.from("portfolio_settings").select("key,value");
      const map: Record<string, string> = {};
      (data || []).forEach((r: any) => (map[r.key] = r.value ?? ""));
      setValues(map);
      setLoading(false);
    })();
  }, []);

  const saveAll = async () => {
    const rows = SETTING_KEYS.map(({ key }) => ({ key, value: values[key] ?? "" }));
    const { error } = await sb.from("portfolio_settings").upsert(rows, { onConflict: "key" });
    if (error) return toast.error(error.message);
    toast.success("Configurações salvas");
  };

  if (loading) return <p>Carregando...</p>;
  return (
    <div className="space-y-4 max-w-2xl">
      {SETTING_KEYS.map(({ key, label }) => (
        <div key={key}>
          <Label>{label}</Label>
          <Input value={values[key] || ""} onChange={(e) => setValues((p) => ({ ...p, [key]: e.target.value }))} />
        </div>
      ))}
      <Button onClick={saveAll}>
        <Save className="h-4 w-4 mr-2" /> Salvar configurações
      </Button>
    </div>
  );
};

export const AdminPortfolio: React.FC = () => {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Portfólio</h2>
        <p className="text-sm text-muted-foreground">
          Gerencie a landing page pública em <code>/portfolio</code>.
        </p>
      </div>
      <Tabs defaultValue="works">
        <TabsList>
          <TabsTrigger value="works">Trabalhos</TabsTrigger>
          <TabsTrigger value="testimonials">Depoimentos</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>
        <TabsContent value="works" className="mt-4">
          <WorksTab />
        </TabsContent>
        <TabsContent value="testimonials" className="mt-4">
          <TestimonialsTab />
        </TabsContent>
        <TabsContent value="settings" className="mt-4">
          <SettingsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPortfolio;
