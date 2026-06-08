import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2 } from "lucide-react";
import { Campaign, CampaignCost, CampaignResult, marketingService } from "@/services/marketingService";
import { useToast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  campaign: Campaign | null;
  onChanged: () => void;
}

export function CampaignDetailsDialog({ open, onOpenChange, campaign, onChanged }: Props) {
  const { toast } = useToast();
  const [costs, setCosts] = useState<CampaignCost[]>([]);
  const [results, setResults] = useState<CampaignResult[]>([]);
  const [loading, setLoading] = useState(false);

  const [costForm, setCostForm] = useState({ description: "", amount: 0, cost_date: new Date().toISOString().slice(0, 10) });
  const [resultForm, setResultForm] = useState({
    result_date: new Date().toISOString().slice(0, 10),
    leads: 0, sales: 0, revenue: 0,
    impressions: "" as string | number, clicks: "" as string | number,
    cpm: "" as string | number, ctr: "" as string | number,
  });

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

  useEffect(() => { if (open && campaign) load(); }, [open, campaign?.id]);

  if (!campaign) return null;

  const addCost = async () => {
    if (!costForm.description.trim() || costForm.amount <= 0) {
      toast({ title: "Preencha descrição e valor", variant: "destructive" }); return;
    }
    try {
      await marketingService.addCost({ campaign_id: campaign.id, ...costForm });
      setCostForm({ description: "", amount: 0, cost_date: new Date().toISOString().slice(0, 10) });
      await load(); onChanged();
      toast({ title: "Gasto registrado" });
    } catch (e: any) { toast({ title: "Erro", description: e.message, variant: "destructive" }); }
  };

  const addResult = async () => {
    try {
      await marketingService.addResult({
        campaign_id: campaign.id,
        result_date: resultForm.result_date,
        leads: Number(resultForm.leads) || 0,
        sales: Number(resultForm.sales) || 0,
        revenue: Number(resultForm.revenue) || 0,
        impressions: resultForm.impressions === "" ? null : Number(resultForm.impressions),
        clicks: resultForm.clicks === "" ? null : Number(resultForm.clicks),
        cpm: resultForm.cpm === "" ? null : Number(resultForm.cpm),
        ctr: resultForm.ctr === "" ? null : Number(resultForm.ctr),
      });
      setResultForm({
        result_date: new Date().toISOString().slice(0, 10),
        leads: 0, sales: 0, revenue: 0,
        impressions: "", clicks: "", cpm: "", ctr: "",
      });
      await load(); onChanged();
      toast({ title: "Resultado registrado" });
    } catch (e: any) { toast({ title: "Erro", description: e.message, variant: "destructive" }); }
  };

  const removeCost = async (id: string) => {
    await marketingService.deleteCost(id); await load(); onChanged();
  };
  const removeResult = async (id: string) => {
    await marketingService.deleteResult(id); await load(); onChanged();
  };

  const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{campaign.name} — {campaign.platform}</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="daily">
          <TabsList>
            <TabsTrigger value="daily">Desempenho diário</TabsTrigger>
            <TabsTrigger value="costs">Custos</TabsTrigger>
            <TabsTrigger value="results">Resultados</TabsTrigger>
          </TabsList>

          <TabsContent value="daily" className="space-y-4">
            {(() => {
              const map = new Map<string, { spent: number; leads: number; sales: number; revenue: number; impressions: number; clicks: number }>();
              const ensure = (d: string) => {
                if (!map.has(d)) map.set(d, { spent: 0, leads: 0, sales: 0, revenue: 0, impressions: 0, clicks: 0 });
                return map.get(d)!;
              };
              costs.forEach((c) => { ensure(c.cost_date).spent += Number(c.amount || 0); });
              results.forEach((r) => {
                const row = ensure(r.result_date);
                row.leads += r.leads || 0;
                row.sales += r.sales || 0;
                row.revenue += Number(r.revenue || 0);
                row.impressions += Number(r.impressions || 0);
                row.clicks += Number(r.clicks || 0);
              });
              const rows = Array.from(map.entries())
                .sort((a, b) => b[0].localeCompare(a[0]))
                .map(([date, v]) => {
                  const cpl = v.leads > 0 && v.spent > 0 ? v.spent / v.leads : null;
                  const cac = v.sales > 0 && v.spent > 0 ? v.spent / v.sales : null;
                  const roi = v.spent > 0 ? ((v.revenue - v.spent) / v.spent) * 100 : null;
                  return { date, ...v, cpl, cac, roi };
                });
              return (
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.length === 0 && (
                      <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">Nenhum dado diário ainda. Registre custos e resultados nas abas ao lado.</TableCell></TableRow>
                    )}
                    {rows.map((r) => (
                      <TableRow key={r.date}>
                        <TableCell className="font-medium">{new Date(r.date).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" })}</TableCell>
                        <TableCell>{fmt(r.spent)}</TableCell>
                        <TableCell>{r.leads}</TableCell>
                        <TableCell>{r.sales}</TableCell>
                        <TableCell>{fmt(r.revenue)}</TableCell>
                        <TableCell>{r.cpl != null ? fmt(r.cpl) : "-"}</TableCell>
                        <TableCell>{r.cac != null ? fmt(r.cac) : "-"}</TableCell>
                        <TableCell className={r.roi == null ? "" : r.roi >= 0 ? "text-green-600" : "text-red-600"}>
                          {r.roi != null ? `${r.roi.toFixed(1)}%` : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              );
            })()}
          </TabsContent>


          <TabsContent value="costs" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
              <div className="md:col-span-2">
                <Label>Descrição</Label>
                <Input value={costForm.description} onChange={(e) => setCostForm({ ...costForm, description: e.target.value })} />
              </div>
              <div>
                <Label>Valor (R$)</Label>
                <Input type="number" step="0.01" value={costForm.amount} onChange={(e) => setCostForm({ ...costForm, amount: parseFloat(e.target.value) || 0 })} />
              </div>
              <div>
                <Label>Data</Label>
                <Input type="date" value={costForm.cost_date} onChange={(e) => setCostForm({ ...costForm, cost_date: e.target.value })} />
              </div>
              <Button className="md:col-span-4" onClick={addCost}>Adicionar gasto</Button>
            </div>
            <Table>
              <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Descrição</TableHead><TableHead>Valor</TableHead><TableHead /></TableRow></TableHeader>
              <TableBody>
                {costs.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{new Date(c.cost_date).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell>{c.description}</TableCell>
                    <TableCell>{fmt(Number(c.amount))}</TableCell>
                    <TableCell><Button size="icon" variant="ghost" onClick={() => removeCost(c.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                  </TableRow>
                ))}
                {costs.length === 0 && !loading && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Nenhum gasto registrado.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="results" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 items-end">
              <div><Label>Data</Label><Input type="date" value={resultForm.result_date} onChange={(e) => setResultForm({ ...resultForm, result_date: e.target.value })} /></div>
              <div><Label>Leads</Label><Input type="number" value={resultForm.leads} onChange={(e) => setResultForm({ ...resultForm, leads: parseInt(e.target.value) || 0 })} /></div>
              <div><Label>Vendas</Label><Input type="number" value={resultForm.sales} onChange={(e) => setResultForm({ ...resultForm, sales: parseInt(e.target.value) || 0 })} /></div>
              <div><Label>Receita (R$)</Label><Input type="number" step="0.01" value={resultForm.revenue} onChange={(e) => setResultForm({ ...resultForm, revenue: parseFloat(e.target.value) || 0 })} /></div>
              <div><Label>Impressões</Label><Input type="number" value={resultForm.impressions} onChange={(e) => setResultForm({ ...resultForm, impressions: e.target.value })} /></div>
              <div><Label>Cliques</Label><Input type="number" value={resultForm.clicks} onChange={(e) => setResultForm({ ...resultForm, clicks: e.target.value })} /></div>
              <div><Label>CPM</Label><Input type="number" step="0.01" value={resultForm.cpm} onChange={(e) => setResultForm({ ...resultForm, cpm: e.target.value })} /></div>
              <div><Label>CTR (%)</Label><Input type="number" step="0.01" value={resultForm.ctr} onChange={(e) => setResultForm({ ...resultForm, ctr: e.target.value })} /></div>
              <Button className="col-span-2 md:col-span-4" onClick={addResult}>Adicionar resultado</Button>
            </div>
            <Table>
              <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Leads</TableHead><TableHead>Vendas</TableHead><TableHead>Receita</TableHead><TableHead>Impr.</TableHead><TableHead>Cliques</TableHead><TableHead>CPM</TableHead><TableHead>CTR</TableHead><TableHead /></TableRow></TableHeader>
              <TableBody>
                {results.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{new Date(r.result_date).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell>{r.leads}</TableCell>
                    <TableCell>{r.sales}</TableCell>
                    <TableCell>{fmt(Number(r.revenue))}</TableCell>
                    <TableCell>{r.impressions ?? "-"}</TableCell>
                    <TableCell>{r.clicks ?? "-"}</TableCell>
                    <TableCell>{r.cpm ?? "-"}</TableCell>
                    <TableCell>{r.ctr != null ? `${r.ctr}%` : "-"}</TableCell>
                    <TableCell><Button size="icon" variant="ghost" onClick={() => removeResult(r.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                  </TableRow>
                ))}
                {results.length === 0 && !loading && <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground">Nenhum resultado registrado.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
