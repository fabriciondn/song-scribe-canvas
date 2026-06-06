import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CampaignAggregate, computeMetrics } from "@/services/marketingService";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface Props {
  aggregates: CampaignAggregate[];
}

const fmtMoney = (n: number | null | undefined) =>
  n == null ? "-" : Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function MarketingOverview({ aggregates }: Props) {
  const [platform, setPlatform] = useState<string>("all");
  const [start, setStart] = useState<string>("");
  const [end, setEnd] = useState<string>("");

  const platforms = useMemo(() => Array.from(new Set(aggregates.map((a) => a.campaign.platform))), [aggregates]);

  const filtered = useMemo(() => {
    return aggregates.filter((a) => {
      if (platform !== "all" && a.campaign.platform !== platform) return false;
      if (start && a.campaign.start_date < start) return false;
      if (end && (a.campaign.end_date || a.campaign.start_date) > end) return false;
      return true;
    });
  }, [aggregates, platform, start, end]);

  const totals = useMemo(() => {
    const totalSpent = filtered.reduce((s, a) => s + a.metrics.totalSpent, 0);
    const totalBudget = filtered.reduce((s, a) => s + Number(a.campaign.total_budget || 0), 0);
    const totalLeads = filtered.reduce((s, a) => s + a.metrics.totalLeads, 0);
    const totalSales = filtered.reduce((s, a) => s + a.metrics.totalSales, 0);
    const totalRevenue = filtered.reduce((s, a) => s + a.metrics.totalRevenue, 0);
    return {
      totalSpent, totalBudget, totalLeads, totalSales, totalRevenue,
      cpl: totalLeads > 0 && totalSpent > 0 ? totalSpent / totalLeads : null,
      cac: totalSales > 0 && totalSpent > 0 ? totalSpent / totalSales : null,
      roi: totalSpent > 0 ? ((totalRevenue - totalSpent) / totalSpent) * 100 : null,
    };
  }, [filtered]);

  const barData = filtered.map((a) => ({
    name: a.campaign.name.length > 14 ? a.campaign.name.slice(0, 14) + "…" : a.campaign.name,
    Gasto: a.metrics.totalSpent,
    Receita: a.metrics.totalRevenue,
  }));

  // Time-series: by start_date month
  const timeData = useMemo(() => {
    const buckets = new Map<string, { date: string; gasto: number; receita: number; leads: number; vendas: number }>();
    filtered.forEach((a) => {
      const key = a.campaign.start_date.slice(0, 7);
      const b = buckets.get(key) || { date: key, gasto: 0, receita: 0, leads: 0, vendas: 0 };
      b.gasto += a.metrics.totalSpent;
      b.receita += a.metrics.totalRevenue;
      b.leads += a.metrics.totalLeads;
      b.vendas += a.metrics.totalSales;
      buckets.set(key, b);
    });
    return Array.from(buckets.values()).sort((x, y) => x.date.localeCompare(y.date));
  }, [filtered]);

  const KPI = ({ label, value, color }: { label: string; value: string; color?: string }) => (
    <Card><CardContent className="p-4">
      <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color ?? ""}`}>{value}</p>
    </CardContent></Card>
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 flex flex-wrap gap-3 items-end">
          <div className="grid gap-1"><Label className="text-xs">Plataforma</Label>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {platforms.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1"><Label className="text-xs">De</Label>
            <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="w-44" />
          </div>
          <div className="grid gap-1"><Label className="text-xs">Até</Label>
            <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="w-44" />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <KPI label="Orçamento diário" value={fmtMoney(totals.totalBudget)} />
        <KPI label="Gasto total" value={fmtMoney(totals.totalSpent)} />
        <KPI label="Receita" value={fmtMoney(totals.totalRevenue)} />
        <KPI label="Leads" value={String(totals.totalLeads)} />
        <KPI label="Vendas" value={String(totals.totalSales)} />
        <KPI label="CPL" value={fmtMoney(totals.cpl)} />
        <KPI label="CAC" value={fmtMoney(totals.cac)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">ROI</p>
          <p className={`text-3xl font-bold mt-1 ${totals.roi != null && totals.roi >= 0 ? "text-green-600" : "text-red-600"}`}>
            {totals.roi == null ? "-" : `${totals.roi.toFixed(1)}%`}
          </p>
        </CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Gasto vs Receita por campanha</CardTitle></CardHeader>
          <CardContent style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(v: any) => fmtMoney(Number(v))} />
                <Legend />
                <Bar dataKey="Gasto" fill="hsl(var(--destructive))" />
                <Bar dataKey="Receita" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Evolução mensal</CardTitle></CardHeader>
          <CardContent style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="gasto" stroke="hsl(var(--destructive))" />
                <Line type="monotone" dataKey="receita" stroke="hsl(var(--primary))" />
                <Line type="monotone" dataKey="leads" stroke="hsl(var(--muted-foreground))" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
