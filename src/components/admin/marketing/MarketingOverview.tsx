import { useMemo, useState } from "react";
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

/* ---------- Premium primitives ---------- */

const Panel: React.FC<{
  children: React.ReactNode;
  className?: string;
  tint?: string;
}> = ({ children, className = "", tint }) => (
  <div
    className={`relative overflow-hidden rounded-2xl bg-white/[0.025] border border-white/[0.05]
                shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_18px_36px_-25px_rgba(0,0,0,0.6)]
                ${className}`}
  >
    {tint && <div className={`absolute inset-0 pointer-events-none ${tint}`} />}
    <div className="relative">{children}</div>
  </div>
);

const PanelHeader: React.FC<{
  kicker: string;
  title: string;
  dot: string;
}> = ({ kicker, title, dot }) => (
  <div className="px-4 pt-3 pb-2 border-b border-white/[0.05]">
    <div className="flex items-center gap-2">
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      <span className="text-[10px] uppercase tracking-[0.18em] text-white/45">{kicker}</span>
    </div>
    <h3 className="mt-0.5 text-white text-[13px] font-light tracking-tight">{title}</h3>
  </div>
);

const KPITile: React.FC<{
  kicker: string;
  value: string;
  hint?: string;
  icon: React.ElementType;
  tint: string;
  dot: string;
}> = ({ kicker, value, hint, icon: Icon, tint, dot }) => (
  <div
    className="relative overflow-hidden rounded-xl p-3 bg-white/[0.025]
               shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_14px_28px_-22px_rgba(0,0,0,0.55)]"
  >
    <div className={`absolute inset-0 pointer-events-none ${tint}`} />
    <div className="relative flex items-start justify-between gap-2">
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={`h-1 w-1 rounded-full ${dot}`} />
          <span className="text-[9px] uppercase tracking-[0.16em] text-white/45 truncate">{kicker}</span>
        </div>
        <p className="mt-1.5 text-[17px] leading-none font-light tracking-tight text-white tabular-nums truncate">
          {value}
        </p>
        {hint && <p className="mt-1 text-[10px] text-white/40 truncate">{hint}</p>}
      </div>
      <Icon className="h-4 w-4 text-white/40 shrink-0" strokeWidth={1.5} />
    </div>
  </div>
);

const chartTooltipStyle = {
  contentStyle: {
    background: "#0c0c0e",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 12,
    fontSize: 12,
    color: "#fff",
    boxShadow: "0 18px 36px -18px rgba(0,0,0,0.7)",
  },
  labelStyle: { color: "rgba(255,255,255,0.55)", fontSize: 11 },
  itemStyle: { color: "#fff" },
} as const;

const PIE_COLORS = ["#60a5fa", "#34d399", "#f59e0b", "#22d3ee", "#a78bfa", "#f472b6"];

/* ---------- Component ---------- */

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

  const campaignComparison = filtered
    .map((a) => ({
      name: a.campaign.name.length > 16 ? a.campaign.name.slice(0, 16) + "…" : a.campaign.name,
      Gasto: Number(a.metrics.totalSpent.toFixed(2)),
      Receita: Number(a.metrics.totalRevenue.toFixed(2)),
      Lucro: Number((a.metrics.totalRevenue - a.metrics.totalSpent).toFixed(2)),
    }))
    .sort((a, b) => b.Receita - a.Receita);

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
        label: new Date(d.date + "T00:00:00").toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
        }),
      }));
  }, [filtered]);

  const platformDistribution = useMemo(() => {
    const m = new Map<string, number>();
    filtered.forEach((a) => {
      m.set(a.campaign.platform, (m.get(a.campaign.platform) || 0) + a.metrics.totalSpent);
    });
    return Array.from(m.entries()).map(([name, value]) => ({ name, value: Number(value.toFixed(2)) }));
  }, [filtered]);

  const roiRadial = [
    {
      name: "ROI",
      value: totals.roi != null ? Math.max(-100, Math.min(totals.roi, 1000)) : 0,
      fill: totals.roi != null && totals.roi >= 0 ? "#34d399" : "#f87171",
    },
  ];

  const toggleCampaign = (id: string) => {
    setSelectedCampaignIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const lucro = totals.totalRevenue - totals.totalSpent;

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <Panel className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-3.5 w-3.5 text-white/45" />
          <span className="text-[10px] uppercase tracking-[0.18em] text-white/45">Filtros</span>
          {(platform !== "all" || start || end || statusFilter !== "all" || selectedCampaignIds.length > 0) && (
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto h-7 text-[11px] text-white/60 hover:text-white hover:bg-white/[0.06]"
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
            <Label className="text-[10px] uppercase tracking-[0.14em] text-white/40">Plataforma</Label>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger className="w-44 h-9 bg-white/[0.03] border-white/[0.06] text-white text-[12px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {platforms.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1">
            <Label className="text-[10px] uppercase tracking-[0.14em] text-white/40">Status</Label>
            <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
              <SelectTrigger className="w-40 h-9 bg-white/[0.03] border-white/[0.06] text-white text-[12px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="active">Apenas ativas</SelectItem>
                <SelectItem value="finished">Apenas finalizadas</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1">
            <Label className="text-[10px] uppercase tracking-[0.14em] text-white/40">Campanhas</Label>
            <Popover open={campaignPopoverOpen} onOpenChange={setCampaignPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-56 h-9 justify-between bg-white/[0.03] border-white/[0.06] text-white text-[12px] hover:bg-white/[0.05]"
                >
                  <span className="truncate">
                    {selectedCampaignIds.length === 0
                      ? "Todas as campanhas"
                      : `${selectedCampaignIds.length} selecionada(s)`}
                  </span>
                  <Megaphone className="h-3.5 w-3.5 ml-2 opacity-60" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-0 bg-[#0c0c0e] border-white/[0.06]" align="start">
                <div className="p-2 max-h-72 overflow-y-auto space-y-1">
                  {aggregates.length === 0 && (
                    <p className="text-[11px] text-white/45 p-2">Nenhuma campanha cadastrada.</p>
                  )}
                  {aggregates.map((a) => {
                    const checked = selectedCampaignIds.includes(a.campaign.id);
                    const active = isCampaignActive(a);
                    return (
                      <label
                        key={a.campaign.id}
                        className="flex items-center gap-2 p-2 rounded-md hover:bg-white/[0.05] cursor-pointer text-[12px] text-white/80"
                      >
                        <Checkbox checked={checked} onCheckedChange={() => toggleCampaign(a.campaign.id)} />
                        <span className="truncate flex-1">{a.campaign.name}</span>
                        {active ? (
                          <CircleDot className="h-3 w-3 text-emerald-400" />
                        ) : (
                          <CheckCircle2 className="h-3 w-3 text-white/40" />
                        )}
                      </label>
                    );
                  })}
                </div>
                {selectedCampaignIds.length > 0 && (
                  <div className="border-t border-white/[0.06] p-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-[11px] text-white/70 hover:text-white hover:bg-white/[0.05]"
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
            <Label className="text-[10px] uppercase tracking-[0.14em] text-white/40">De</Label>
            <Input
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="w-40 h-9 bg-white/[0.03] border-white/[0.06] text-white text-[12px]"
            />
          </div>
          <div className="grid gap-1">
            <Label className="text-[10px] uppercase tracking-[0.14em] text-white/40">Até</Label>
            <Input
              type="date"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="w-40 h-9 bg-white/[0.03] border-white/[0.06] text-white text-[12px]"
            />
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
                  className="cursor-pointer bg-white/[0.06] text-white/80 hover:bg-red-400/15 hover:text-red-300 ring-1 ring-white/10"
                  onClick={() => toggleCampaign(id)}
                >
                  {c.campaign.name} ×
                </Badge>
              );
            })}
          </div>
        )}
      </Panel>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-2">
        <KPITile
          kicker="Orçam. diário"
          value={fmtMoney(totals.dailyBudgetActive)}
          hint={`${totals.activeCount} ativa(s) • ${totals.finishedCount} finalizada(s)`}
          icon={Wallet}
          tint="bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.1),transparent_55%)]"
          dot="bg-violet-400"
        />
        <KPITile
          kicker="Gasto total"
          value={fmtMoney(totals.totalSpent)}
          icon={DollarSign}
          tint="bg-[radial-gradient(circle_at_top_right,rgba(239,68,68,0.08),transparent_55%)]"
          dot="bg-red-400"
        />
        <KPITile
          kicker="Receita"
          value={fmtMoney(totals.totalRevenue)}
          icon={TrendingUp}
          tint="bg-[radial-gradient(circle_at_top_right,rgba(52,211,153,0.1),transparent_55%)]"
          dot="bg-emerald-400"
        />
        <KPITile
          kicker="Lucro"
          value={fmtMoney(lucro)}
          icon={lucro >= 0 ? TrendingUp : TrendingDown}
          tint={
            lucro >= 0
              ? "bg-[radial-gradient(circle_at_top_right,rgba(52,211,153,0.1),transparent_55%)]"
              : "bg-[radial-gradient(circle_at_top_right,rgba(239,68,68,0.08),transparent_55%)]"
          }
          dot={lucro >= 0 ? "bg-emerald-400" : "bg-red-400"}
        />
        <KPITile
          kicker="Leads"
          value={String(totals.totalLeads)}
          icon={Users}
          tint="bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.08),transparent_55%)]"
          dot="bg-cyan-400"
        />
        <KPITile
          kicker="Vendas"
          value={String(totals.totalSales)}
          icon={Target}
          tint="bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.08),transparent_55%)]"
          dot="bg-amber-400"
        />
        <KPITile
          kicker="CPL"
          value={fmtMoney(totals.cpl)}
          icon={MousePointerClick}
          tint="bg-[radial-gradient(circle_at_top_right,rgba(96,165,250,0.08),transparent_55%)]"
          dot="bg-sky-400"
        />
        <KPITile
          kicker="CAC"
          value={fmtMoney(totals.cac)}
          icon={Activity}
          tint="bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.08),transparent_55%)]"
          dot="bg-amber-400"
        />
      </div>

      {/* ROI + Conversão + Ticket */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Panel className="p-3" tint="bg-[radial-gradient(circle_at_top_right,rgba(52,211,153,0.08),transparent_55%)]">
          <div style={{ height: 120 }}>
            <p className="text-[10px] uppercase tracking-[0.18em] text-white/45 mb-1">ROI</p>
            <ResponsiveContainer width="100%" height="85%">
              <RadialBarChart innerRadius="65%" outerRadius="100%" data={roiRadial} startAngle={90} endAngle={-270}>
                <RadialBar background={{ fill: "rgba(255,255,255,0.05)" }} dataKey="value" cornerRadius={10} />
                <text
                  x="50%"
                  y="50%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-white"
                  style={{ fontSize: 20, fontWeight: 300 }}
                >
                  {totals.roi == null ? "—" : `${totals.roi.toFixed(1)}%`}
                </text>
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel className="p-4 flex flex-col justify-center" tint="bg-[radial-gradient(circle_at_top_right,rgba(96,165,250,0.06),transparent_55%)]">
          <div style={{ height: 120 }} className="flex flex-col justify-center">
            <p className="text-[10px] uppercase tracking-[0.18em] text-white/45">Taxa de Conversão</p>
            <p className="text-3xl font-light text-white mt-1 tabular-nums">
              {totals.conversion == null ? "—" : `${totals.conversion.toFixed(1)}%`}
            </p>
            <p className="text-[10px] text-white/45 mt-1">
              {totals.totalSales} vendas / {totals.totalLeads} leads
            </p>
          </div>
        </Panel>

        <Panel className="p-4 flex flex-col justify-center" tint="bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.06),transparent_55%)]">
          <div style={{ height: 120 }} className="flex flex-col justify-center">
            <p className="text-[10px] uppercase tracking-[0.18em] text-white/45">Ticket Médio</p>
            <p className="text-3xl font-light text-white mt-1 tabular-nums">{fmtMoney(totals.ticketMedio)}</p>
            <p className="text-[10px] text-white/45 mt-1">Receita / Vendas</p>
          </div>
        </Panel>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Panel className="lg:col-span-2" tint="bg-[radial-gradient(circle_at_top_right,rgba(52,211,153,0.05),transparent_55%)]">
          <PanelHeader kicker="Série" title="Evolução diária" dot="bg-emerald-400" />
          <div className="p-3" style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyEvolution} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gGasto" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f87171" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gReceita" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }} tickLine={false} axisLine={false} />
                <Tooltip
                  {...chartTooltipStyle}
                  formatter={(v: any, name: any) =>
                    name === "leads" || name === "vendas" ? v : fmtMoney(Number(v))
                  }
                />
                <Legend wrapperStyle={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }} />
                <Area type="monotone" dataKey="gasto" stroke="#f87171" fill="url(#gGasto)" strokeWidth={1.5} />
                <Area type="monotone" dataKey="receita" stroke="#34d399" fill="url(#gReceita)" strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel tint="bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.06),transparent_55%)]">
          <PanelHeader kicker="Mix" title="Gasto por plataforma" dot="bg-violet-400" />
          <div className="p-3" style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={platformDistribution}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={3}
                  stroke="rgba(12,12,14,0.9)"
                  strokeWidth={2}
                >
                  {platformDistribution.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip {...chartTooltipStyle} formatter={(v: any) => fmtMoney(Number(v))} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <Panel tint="bg-[radial-gradient(circle_at_top_right,rgba(96,165,250,0.05),transparent_55%)]">
        <PanelHeader kicker="Ranking" title="Comparativo por campanha" dot="bg-sky-400" />
        <div className="p-3" style={{ height: 240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={campaignComparison} barGap={4} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }} tickLine={false} axisLine={false} />
              <Tooltip {...chartTooltipStyle} cursor={{ fill: "rgba(255,255,255,0.03)" }} formatter={(v: any) => fmtMoney(Number(v))} />
              <Legend wrapperStyle={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }} />
              <Bar dataKey="Gasto" fill="#f87171" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Receita" fill="#34d399" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Lucro" fill="#a78bfa" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>
    </div>
  );
}
