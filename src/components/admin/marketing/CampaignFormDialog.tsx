import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Campaign, marketingService } from "@/services/marketingService";
import { useToast } from "@/hooks/use-toast";

const PLATFORMS = ["Facebook Ads", "Instagram Ads", "Google Ads", "YouTube Ads", "TikTok Ads", "E-mail Marketing", "Influenciadores", "Outro"];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  campaign?: Campaign | null;
  onSaved: () => void;
}

export function CampaignFormDialog({ open, onOpenChange, campaign, onSaved }: Props) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    platform: "Facebook Ads",
    start_date: new Date().toISOString().slice(0, 10),
    end_date: "",
    total_budget: 0,
    notes: "",
  });

  useEffect(() => {
    if (campaign) {
      setForm({
        name: campaign.name,
        platform: campaign.platform,
        start_date: campaign.start_date,
        end_date: campaign.end_date ?? "",
        total_budget: Number(campaign.total_budget || 0),
        notes: campaign.notes ?? "",
      });
    } else {
      setForm({
        name: "",
        platform: "Facebook Ads",
        start_date: new Date().toISOString().slice(0, 10),
        end_date: "",
        total_budget: 0,
        notes: "",
      });
    }
  }, [campaign, open]);

  const submit = async () => {
    if (!form.name.trim()) {
      toast({ title: "Nome obrigatório", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        platform: form.platform,
        start_date: form.start_date,
        end_date: form.end_date || null,
        total_budget: Number(form.total_budget) || 0,
        notes: form.notes || null,
      };
      if (campaign) {
        await marketingService.updateCampaign(campaign.id, payload);
        toast({ title: "Campanha atualizada" });
      } else {
        await marketingService.createCampaign(payload as any);
        toast({ title: "Campanha criada" });
      }
      onSaved();
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{campaign ? "Editar Campanha" : "Nova Campanha"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>Nome</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid gap-2">
            <Label>Plataforma</Label>
            <Select value={form.platform} onValueChange={(v) => setForm({ ...form, platform: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PLATFORMS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Data de início</Label>
              <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Data de fim</Label>
              <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Orçamento diário (R$)</Label>
            <Input type="number" step="0.01" value={form.total_budget} onChange={(e) => setForm({ ...form, total_budget: parseFloat(e.target.value) || 0 })} />
          </div>
          <div className="grid gap-2">
            <Label>Notas</Label>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
