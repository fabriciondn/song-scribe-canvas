import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Pencil, Plus, X } from "lucide-react";
import { Campaign, CampaignCost, CampaignResult, computeMetrics, marketingService } from "@/services/marketingService";
import { useToast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  campaign: Campaign | null;
  onChanged: () => void;
}

const DAILY_COST_DESCRIPTION = "Gasto do dia";
const today = () => new Date().toISOString().slice(0, 10);

export function CampaignDetailsDialog({ open, onOpenChange, campaign, onChanged }: Props) {
  const { toast } = useToast();
  const [costs, setCosts] = useState<CampaignCost[]>([]);
  const [results, setResults] = useState<CampaignResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    date: today(),
    spent: "" as string,
    leads: "" as string,
    sales: "" as string,
    revenue: "" as string,
  });
  const [editingDate, setEditingDate] = useState<string | null>(null);

  const load = async () => {
    if (!campaign) return;
    setLoading(true);
    try {
      const [c, r] = await Promise.all([
        marketingService.listCosts(campaign.id),
        marketingService.listResults(campaign.id),
      ]);
      setCosts(c); setResults(r);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (open && campaign) {
      load();
      resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, campaign?.id]);

  const resetForm = () => {
    setForm({ date: today(), spent: "", leads: "", sales: "", revenue: "" });
    setEditingDate(null);
  };

  const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const metrics = useMemo(
    () => campaign ? computeMetrics(campaign, costs, results) : null,
    [campaign, costs, results]
  );

  const daily = useMemo(() => {
    const map = new Map<string, { spent: number; leads: number; sales: number; revenue: number }>();
    const ensure = (d: string) => {
      if (!map.has(d)) map.set(d, { spent: 0, leads: 0, sales: 0, revenue: 0 });
      return map.get(d)!;
    };
    costs.forEach((c) => { ensure(c.cost_date).spent += Number(c.amount || 0); });
    results.forEach((r) => {
      const row = ensure(r.result_date);
      row.leads += r.leads || 0;
      row.sales += r.sales || 0;
      row.revenue += Number(r.revenue || 0);
    });
    return Array.from(map.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([date, v]) => {
        const cpl = v.leads > 0 && v.spent > 0 ? v.spent / v.leads : null;
        const cac = v.sales > 0 && v.spent > 0 ? v.spent / v.sales : null;
        const roi = v.spent > 0 ? ((v.revenue - v.spent) / v.spent) * 100 : null;
        return { date, ...v, cpl, cac, roi };
      });
  }, [costs, results]);

  if (!campaign) return null;

  const startEdit = (date: string) => {
    const dayCosts = costs.filter((c) => c.cost_date === date);
    const dayResults = results.filter((r) => r.result_date === date);
    const spent = dayCosts.reduce((s, c) => s + Number(c.amount || 0), 0);
    const leads = dayResults.reduce((s, r) => s + (r.leads || 0), 0);
    const sales = dayResults.reduce((s, r) => s + (r.sales || 0), 0);
    const revenue = dayResults.reduce((s, r) => s + Number(r.revenue || 0), 0);
    setForm({
      date,
      spent: spent ? String(spent) : "",
      leads: leads ? String(leads) : "",
      sales: sales ? String(sales) : "",
      revenue: revenue ? String(revenue) : "",
    });
    setEditingDate(date);
  };

  const submit = async () => {
    if (!campaign) return;
    const spent = parseFloat(form.spent) || 0;
    const leads = parseInt(form.leads) || 0;
    const sales = parseInt(form.sales) || 0;
    const revenue = parseFloat(form.revenue) || 0;

    if (spent <= 0 && leads === 0 && sales === 0 && revenue === 0) {
      toast({ title: "Informe pelo menos um valor", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      // Upsert cost-of-day: there is at most one row per date with our marker description
      const existingDailyCost = costs.find(
        (c) => c.cost_date === form.date && c.description === DAILY_COST_DESCRIPTION
      );
      const otherCostsSameDay = costs
        .filter((c) => c.cost_date === form.date && c.description !== DAILY_COST_DESCRIPTION)
        .reduce((s, c) => s + Number(c.amount || 0), 0);
      // Spent in the form represents the TOTAL for the day. Subtract other costs to compute the daily marker amount.
      const dailyAmount = Math.max(0, spent - otherCostsSameDay);

      if (spent > 0) {
        if (existingDailyCost) {
          await marketingService.updateCost(existingDailyCost.id, { amount: dailyAmount, cost_date: form.date });
        } else if (dailyAmount > 0) {
          await marketingService.addCost({
            campaign_id: campaign.id,
            description: DAILY_COST_DESCRIPTION,
            amount: dailyAmount,
            cost_date: form.date,
          });
        }
      } else if (existingDailyCost) {
        // user cleared spent → remove daily marker
        await marketingService.deleteCost(existingDailyCost.id);
      }

      // Upsert results: keep a single daily row by deleting any prior rows for that date
      const existingResults = results.filter((r) => r.result_date === form.date);
      if (leads || sales || revenue) {
        // delete all existing and insert one consolidated row
        for (const r of existingResults) {
          await marketingService.deleteResult(r.id);
        }
        await marketingService.addResult({
          campaign_id: campaign.id,
          result_date: form.date,
          leads, sales, revenue,
          impressions: null, clicks: null, cpm: null, ctr: null,
        });
      } else {
        // cleared → remove
        for (const r of existingResults) {
          await marketingService.deleteResult(r.id);
        }
      }

      await load();
      onChanged();
      resetForm();
      toast({ title: editingDate ? "Dia atualizado" : "Dia lançado" });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const removeDay = async (date: string) => {
    if (!confirm(`Remover todos os lançamentos do dia ${new Date(date).toLocaleDateString("pt-BR")}?`)) return;
    try {
      const dayCosts = costs.filter((c) => c.cost_date === date);
      const dayResults = results.filter((r) => r.result_date === date);
      for (const c of dayCosts) await marketingService.deleteCost(c.id);
      for (const r of dayResults) await marketingService.deleteResult(r.id);
      await load(); onChanged();
      if (editingDate === date) resetForm();
      toast({ title: "Dia removido" });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{campaign.name}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {campaign.platform} · Orçamento diário: {fmt(Number(campaign.total_budget || 0))}
          </p>
        </DialogHeader>

        {/* KPIs — totais somados automaticamente */}
        {metrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
            <Kpi label="Gasto total" value={fmt(metrics.totalSpent)} />
            <Kpi label="Leads" value={metrics.totalLeads.toString()} />
            <Kpi label="Vendas" value={metrics.totalSales.toString()} />
            <Kpi label="Receita" value={fmt(metrics.totalRevenue)} />
            <Kpi label="CPL" value={metrics.cpl != null ? fmt(metrics.cpl) : "-"} />
            <Kpi label="CAC" value={metrics.cac != null ? fmt(metrics.cac) : "-"} />
            <Kpi
              label="ROI"
              value={metrics.roi != null ? `${metrics.roi.toFixed(1)}%` : "-"}
              accent={metrics.roi == null ? undefined : metrics.roi >= 0 ? "positive" : "negative"}
            />
          </div>
        )}

        {/* Lançamento do dia */}
        <div className="p-4 rounded-lg border bg-muted/30 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">
              {editingDate ? `Editando ${new Date(editingDate).toLocaleDateString("pt-BR")}` : "Lançar dia"}
            </h3>
            {editingDate && (
              <Button variant="ghost" size="sm" onClick={resetForm}>
                <X className="h-4 w-4 mr-1" /> Cancelar edição
              </Button>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-2 items-end">
            <div>
              <Label className="text-xs">Data</Label>
              <Input
                type="date"
                value={form.date}
                disabled={!!editingDate}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-xs">Gasto (R$)</Label>
              <Input
                type="number" step="0.01" placeholder="0,00" inputMode="decimal"
                value={form.spent}
                onChange={(e) => setForm({ ...form, spent: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-xs">Leads</Label>
              <Input
                type="number" placeholder="0" inputMode="numeric"
                value={form.leads}
                onChange={(e) => setForm({ ...form, leads: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-xs">Vendas</Label>
              <Input
                type="number" placeholder="0" inputMode="numeric"
                value={form.sales}
                onChange={(e) => setForm({ ...form, sales: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-xs">Receita (R$)</Label>
              <Input
                type="number" step="0.01" placeholder="0,00" inputMode="decimal"
                value={form.revenue}
                onChange={(e) => setForm({ ...form, revenue: e.target.value })}
              />
            </div>
            <Button onClick={submit} disabled={saving}>
              {editingDate ? <Pencil className="h-4 w-4 mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
              {editingDate ? "Salvar" : "Lançar"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Dica: clique em uma linha abaixo para editar os valores daquele dia. Os totais e métricas (CPL, CAC, ROI) somam automaticamente.
          </p>
        </div>

        {/* Tabela diária */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Gasto</TableHead>
              <TableHead>Leads</TableHead>
              <TableHead>Vendas</TableHead>
              <TableHead>Receita</TableHead>
              <TableHead>CPL</TableHead>
              <TableHead>CAC</TableHead>
              <TableHead>ROI</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {daily.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground py-6">
                  Nenhum dia lançado ainda. Use o formulário acima para começar.
                </TableCell>
              </TableRow>
            )}
            {daily.map((r) => (
              <TableRow
                key={r.date}
                className={editingDate === r.date ? "bg-primary/10" : "cursor-pointer hover:bg-muted/40"}
                onClick={() => startEdit(r.date)}
              >
                <TableCell className="font-medium">
                  {new Date(r.date).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" })}
                </TableCell>
                <TableCell>{fmt(r.spent)}</TableCell>
                <TableCell>{r.leads}</TableCell>
                <TableCell>{r.sales}</TableCell>
                <TableCell>{fmt(r.revenue)}</TableCell>
                <TableCell>{r.cpl != null ? fmt(r.cpl) : "-"}</TableCell>
                <TableCell>{r.cac != null ? fmt(r.cac) : "-"}</TableCell>
                <TableCell className={r.roi == null ? "" : r.roi >= 0 ? "text-green-600" : "text-red-600"}>
                  {r.roi != null ? `${r.roi.toFixed(1)}%` : "-"}
                </TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <Button size="icon" variant="ghost" onClick={() => startEdit(r.date)} title="Editar">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => removeDay(r.date)} title="Excluir dia">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DialogContent>
    </Dialog>
  );
}

function Kpi({ label, value, accent }: { label: string; value: string; accent?: "positive" | "negative" }) {
  return (
    <div className="rounded-md border bg-card px-3 py-2">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div
        className={
          "text-base font-semibold " +
          (accent === "positive" ? "text-green-600" : accent === "negative" ? "text-red-600" : "")
        }
      >
        {value}
      </div>
    </div>
  );
}
