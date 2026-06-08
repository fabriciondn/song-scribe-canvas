import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CampaignAggregate } from "@/services/marketingService";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  CheckCircle2,
  CircleDot,
  DollarSign,
  Filter,
  Megaphone,
  MousePointerClick,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";

interface Props {
  aggregates: CampaignAggregate[];
}

const fmtMoney = (n: number | null | undefined) =>
  n == null ? "—" : Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const isCampaignActive = (a: CampaignAggregate) => {
  if (!a.campaign.end_date) return true;
  return new Date(a.campaign.end_date) >= new Date(new Date().toDateString());
};

export function MarketingOverview({ aggregates }: Props) {
  const [platform, setPlatform] = useState<string>("all");
  const [start, setStart] = useState<string>("");
  const [end, setEnd] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "finished">("all");
  const [selectedCampaignIds, setSelectedCampaignIds] = useState<string[]>([]);
  const [campaignPopoverOpen, setCampaignPopoverOpen] = useState(false);

  const platforms = useMemo(
    () => Array.from(new Set(aggregates.map((a) => a.campaign.platform))),
    [aggregates]
  );

  const filtered = useMemo(() => {
    return aggregates.filter((a) => {
      if (platform !== "all" && a.campaign.platform !== platform) return false;
      if (start && a.campaign.start_date < start) return false;
      if (end && (a.campaign.end_date || a.campaign.start_date) > end) return false;
      if (statusFilter === "active" && !isCampaignActive(a)) return false;
      if (statusFilter === "finished" && isCampaignActive(a)) return false;
      if (selectedCampaignIds.length > 0 && !selectedCampaignIds.includes(a.campaign.id)) return false;
      return true;
    });
  }, [aggregates, platform, start, end, statusFilter, selectedCampaignIds]);

  const totals = useMemo(() => {
    // Orçamento diário considera apenas campanhas ativas dentro do filtro
    const activeFiltered = filtered.filter(isCampaignActive);
    const dailyBudgetActive = activeFiltered.reduce(
      (s, a) => s + Number(a.campaign.total_budget || 0),
      0
    );
    const totalSpent = filtered.reduce((s, a) => s + a.metrics.totalSpent, 0);
    const totalLeads = filtered.reduce((s, a) => s + a.metrics.totalLeads, 0);
    const totalSales = filtered.reduce((s, a) => s + a.metrics.totalSales, 0);
    const totalRevenue = filtered.reduce((s, a) => s + a.metrics.totalRevenue, 0);
    const activeCount = activeFiltered.length;
    const finishedCount = filtered.length - activeCount;
    return {
      dailyBudgetActive,
      totalSpent,
      totalLeads,
      totalSales,
      totalRevenue,
      activeCount,
      finishedCount,
      conversion: totalLeads > 0 ? (totalSales / totalLeads) * 100 : null,
      cpl: totalLeads > 0 && totalSpent > 0 ? totalSpent / totalLeads : null,
      cac: totalSales > 0 && totalSpent > 0 ? totalSpent / totalSales : null,
      roi: totalSpent > 0 ? ((totalRevenue - totalSpent) / totalSpent) * 100 : null,
      ticketMedio: totalSales > 0 ? totalRevenue / totalSales : null,
    };
  }, [filtered]);

  // ===== Chart data =====
  const campaignComparison = filtered
    .map((a) => ({
      name: a.campaign.name.length > 16 ? a.campaign.name.slice(0, 16) + "…" : a.campaign.name,
      Gasto: Number(a.metrics.totalSpent.toFixed(2)),
      Receita: Number(a.metrics.totalRevenue.toFixed(2)),
      Lucro: Number((a.metrics.totalRevenue - a.metrics.totalSpent).toFixed(2)),
    }))
    .sort((a, b) => b.Receita - a.Receita);

  // Daily evolution from costs + results across filtered campaigns
  const dailyEvolution = useMemo(() => {
    const map = new Map<string, { date: string; gasto: number; receita: number; leads: number; vendas: number }>();
    filtered.forEach((a) => {
      a.costs.forEach((c) => {
        const key = c.cost_date;
        const b = map.get(key) || { date: key, gasto: 0, receita: 0, leads: 0, vendas: 0 };
        b.gasto += Number(c.amount || 0);
        map.set(key, b);
      });
      a.results.forEach((r) => {
        const key = r.result_date;
        const b = map.get(key) || { date: key, gasto: 0, receita: 0, leads: 0, vendas: 0 };
        b.receita += Number(r.revenue || 0);
        b.leads += r.leads || 0;
        b.vendas += r.sales || 0;
        map.set(key, b);
      });
    });
    return Array.from(map.values())
      .sort((x, y) => x.date.localeCompare(y.date))
      .map((d) => ({
        ...d,
        label: new Date(d.date + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      }));
  }, [filtered]);

  // Platform distribution donut
  const platformDistribution = useMemo(() => {
    const m = new Map<string, number>();
    filtered.forEach((a) => {
      m.set(a.campaign.platform, (m.get(a.campaign.platform) || 0) + a.metrics.totalSpent);
    });
    return Array.from(m.entries()).map(([name, value]) => ({ name, value: Number(value.toFixed(2)) }));
  }, [filtered]);

  const PIE_COLORS = ["hsl(var(--primary))", "#22c55e", "#f59e0b", "#06b6d4", "#a855f7", "#ef4444"];

  // ROI radial
  const roiRadial = [
    {
      name: "ROI",
      value: totals.roi != null ? Math.max(-100, Math.min(totals.roi, 1000)) : 0,
      fill: totals.roi != null && totals.roi >= 0 ? "#22c55e" : "#ef4444",
    },
  ];

  const toggleCampaign = (id: string) => {
    setSelectedCampaignIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const KPI = ({
    label,
    value,
    icon: Icon,
    accent,
    subtitle,
  }: {
    label: string;
    value: string;
    icon: any;
    accent?: string;
    subtitle?: string;
  }) => (
    <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-card/50 hover:shadow-lg transition-all">
      <div
        className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-20"
        style={{ background: accent || "hsl(var(--primary))" }}
      />
      <CardContent className="p-4 relative">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">{label}</p>
            <p className="text-2xl font-bold mt-1 truncate">{value}</p>
            {subtitle && <p className="text-[11px] text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div
            className="shrink-0 p-2 rounded-lg"
            style={{ backgroundColor: `${accent || "hsl(var(--primary))"}20` }}
          >
            <Icon className="h-4 w-4" style={{ color: accent || "hsl(var(--primary))" }} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filtros</span>
            {(platform !== "all" || start || end || statusFilter !== "all" || selectedCampaignIds.length > 0) && (
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto h-7 text-xs"
                onClick={() => {
                  setPlatform("all");
                  setStart("");
                  setEnd("");
                  setStatusFilter("all");
                  setSelectedCampaignIds([]);
                }}
              >
                Limpar
              </Button>
            )}
          </div>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="grid gap-1">
              <Label className="text-xs">Plataforma</Label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {platforms.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1">
              <Label className="text-xs">Status</Label>
              <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="active">Apenas ativas</SelectItem>
                  <SelectItem value="finished">Apenas finalizadas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1">
              <Label className="text-xs">Campanhas</Label>
              <Popover open={campaignPopoverOpen} onOpenChange={setCampaignPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-56 justify-between">
                    <span className="truncate">
                      {selectedCampaignIds.length === 0
                        ? "Todas as campanhas"
                        : `${selectedCampaignIds.length} selecionada(s)`}
                    </span>
                    <Megaphone className="h-3.5 w-3.5 ml-2 opacity-60" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-0" align="start">
                  <div className="p-2 max-h-72 overflow-y-auto space-y-1">
                    {aggregates.length === 0 && (
                      <p className="text-xs text-muted-foreground p-2">Nenhuma campanha cadastrada.</p>
                    )}
                    {aggregates.map((a) => {
                      const checked = selectedCampaignIds.includes(a.campaign.id);
                      const active = isCampaignActive(a);
                      return (
                        <label
                          key={a.campaign.id}
                          className="flex items-center gap-2 p-2 rounded-md hover:bg-accent cursor-pointer text-sm"
                        >
                          <Checkbox checked={checked} onCheckedChange={() => toggleCampaign(a.campaign.id)} />
                          <span className="truncate flex-1">{a.campaign.name}</span>
                          {active ? (
                            <CircleDot className="h-3 w-3 text-green-500" />
                          ) : (
                            <CheckCircle2 className="h-3 w-3 text-muted-foreground" />
                          )}
                        </label>
                      );
                    })}
                  </div>
                  {selectedCampaignIds.length > 0 && (
                    <div className="border-t p-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs"
                        onClick={() => setSelectedCampaignIds([])}
                      >
                        Limpar seleção
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid gap-1">
              <Label className="text-xs">De</Label>
              <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="w-40" />
            </div>
            <div className="grid gap-1">
              <Label className="text-xs">Até</Label>
              <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="w-40" />
            </div>
          </div>

          {selectedCampaignIds.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {selectedCampaignIds.map((id) => {
                const c = aggregates.find((a) => a.campaign.id === id);
                if (!c) return null;
                return (
                  <Badge
                    key={id}
                    variant="secondary"
                    className="cursor-pointer hover:bg-destructive/20"
                    onClick={() => toggleCampaign(id)}
                  >
                    {c.campaign.name} ×
                  </Badge>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        <KPI
          label="Orçamento diário (ativas)"
          value={fmtMoney(totals.dailyBudgetActive)}
          icon={Wallet}
          accent="#8b5cf6"
          subtitle={`${totals.activeCount} ativa(s) • ${totals.finishedCount} finalizada(s)`}
        />
        <KPI label="Gasto total" value={fmtMoney(totals.totalSpent)} icon={DollarSign} accent="#ef4444" />
        <KPI label="Receita" value={fmtMoney(totals.totalRevenue)} icon={TrendingUp} accent="#22c55e" />
        <KPI
          label="Lucro"
          value={fmtMoney(totals.totalRevenue - totals.totalSpent)}
          icon={totals.totalRevenue - totals.totalSpent >= 0 ? TrendingUp : TrendingDown}
          accent={totals.totalRevenue - totals.totalSpent >= 0 ? "#22c55e" : "#ef4444"}
        />
        <KPI label="Leads" value={String(totals.totalLeads)} icon={Users} accent="#06b6d4" />
        <KPI label="Vendas" value={String(totals.totalSales)} icon={Target} accent="#f59e0b" />
        <KPI label="CPL" value={fmtMoney(totals.cpl)} icon={MousePointerClick} accent="#06b6d4" />
        <KPI label="CAC" value={fmtMoney(totals.cac)} icon={Activity} accent="#f59e0b" />
      </div>

      {/* ROI + Conversão + Ticket */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="border-border/50 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground uppercase tracking-wider">ROI</CardTitle>
          </CardHeader>
          <CardContent style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                innerRadius="65%"
                outerRadius="100%"
                data={roiRadial}
                startAngle={90}
                endAngle={-270}
              >
                <RadialBar background dataKey="value" cornerRadius={10} />
                <text
                  x="50%"
                  y="50%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-foreground"
                  style={{ fontSize: 28, fontWeight: 700 }}
                >
                  {totals.roi == null ? "—" : `${totals.roi.toFixed(1)}%`}
                </text>
              </RadialBarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground uppercase tracking-wider">Taxa de Conversão</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col justify-center" style={{ height: 180 }}>
            <p className="text-5xl font-bold text-center">
              {totals.conversion == null ? "—" : `${totals.conversion.toFixed(1)}%`}
            </p>
            <p className="text-xs text-muted-foreground text-center mt-2">
              {totals.totalSales} vendas / {totals.totalLeads} leads
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground uppercase tracking-wider">Ticket Médio</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col justify-center" style={{ height: 180 }}>
            <p className="text-5xl font-bold text-center">{fmtMoney(totals.ticketMedio)}</p>
            <p className="text-xs text-muted-foreground text-center mt-2">Receita / Vendas</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Evolução diária</CardTitle>
          </CardHeader>
          <CardContent style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyEvolution}>
                <defs>
                  <linearGradient id="gGasto" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gReceita" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                  }}
                  formatter={(v: any, name: any) =>
                    name === "leads" || name === "vendas" ? v : fmtMoney(Number(v))
                  }
                />
                <Legend />
                <Area type="monotone" dataKey="gasto" stroke="#ef4444" fill="url(#gGasto)" strokeWidth={2} />
                <Area type="monotone" dataKey="receita" stroke="#22c55e" fill="url(#gReceita)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Gasto por plataforma</CardTitle>
          </CardHeader>
          <CardContent style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={platformDistribution}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                >
                  {platformDistribution.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => fmtMoney(Number(v))} />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Comparativo por campanha</CardTitle>
        </CardHeader>
        <CardContent style={{ height: 360 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={campaignComparison} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                }}
                formatter={(v: any) => fmtMoney(Number(v))}
              />
              <Legend />
              <Bar dataKey="Gasto" fill="#ef4444" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Receita" fill="#22c55e" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Lucro" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
