import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, BarChart3, CircleDot, CheckCircle2, Search } from "lucide-react";
import { CampaignAggregate, marketingService, Campaign } from "@/services/marketingService";
import { CampaignFormDialog } from "./CampaignFormDialog";
import { CampaignDetailsDialog } from "./CampaignDetailsDialog";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Props {
  aggregates: CampaignAggregate[];
  loading: boolean;
  onRefresh: () => void;
}

const fmtMoney = (n: number | null | undefined) =>
  n == null ? "-" : Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const fmtPct = (n: number | null) => (n == null ? "-" : `${n.toFixed(1)}%`);

export function CampaignsList({ aggregates, loading, onRefresh }: Props) {
  const { toast } = useToast();
  const [platform, setPlatform] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Campaign | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsTarget, setDetailsTarget] = useState<Campaign | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const platforms = useMemo(() => {
    const set = new Set(aggregates.map((a) => a.campaign.platform));
    return Array.from(set);
  }, [aggregates]);

  const filtered = useMemo(() => {
    return aggregates.filter((a) => {
      if (platform !== "all" && a.campaign.platform !== platform) return false;
      if (search && !a.campaign.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [aggregates, platform, search]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await marketingService.deleteCampaign(deleteId);
      toast({ title: "Campanha excluída" });
      onRefresh();
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally { setDeleteId(null); }
  };

  const th =
    "h-9 text-[10px] uppercase tracking-[0.14em] text-white/40 font-normal";

  return (
    <div
      className="relative overflow-hidden rounded-2xl bg-white/[0.025] border border-white/[0.05]
                 shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_18px_36px_-25px_rgba(0,0,0,0.6)]"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap px-4 py-3 border-b border-white/[0.05]">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
          <span className="text-[10px] uppercase tracking-[0.18em] text-white/45">Listagem</span>
          <span className="text-[11px] text-white/40 ml-1">
            {filtered.length} {filtered.length === 1 ? "campanha" : "campanhas"}
          </span>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/40" />
            <Input
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-48 h-9 bg-white/[0.03] border-white/[0.06] text-white placeholder:text-white/30 text-[12px]"
            />
          </div>
          <Select value={platform} onValueChange={setPlatform}>
            <SelectTrigger className="w-44 h-9 bg-white/[0.03] border-white/[0.06] text-white text-[12px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as plataformas</SelectItem>
              {platforms.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button
            onClick={() => { setEditTarget(null); setEditOpen(true); }}
            size="sm"
            className="h-9 gap-1.5 bg-white/[0.08] hover:bg-white/[0.12] text-white border border-white/[0.08]"
          >
            <Plus className="h-3.5 w-3.5" /> Nova campanha
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table className="min-w-[1100px]">
          <TableHeader>
            <TableRow className="border-white/[0.05] hover:bg-transparent">
              <TableHead className={th}>Status</TableHead>
              <TableHead className={th}>Nome</TableHead>
              <TableHead className={th}>Plataforma</TableHead>
              <TableHead className={th}>Período</TableHead>
              <TableHead className={`${th} text-right`}>Orç. diário</TableHead>
              <TableHead className={`${th} text-right`}>Gasto</TableHead>
              <TableHead className={`${th} text-right`}>Leads</TableHead>
              <TableHead className={`${th} text-right`}>Vendas</TableHead>
              <TableHead className={`${th} text-right`}>Receita</TableHead>
              <TableHead className={`${th} text-right`}>CPL</TableHead>
              <TableHead className={`${th} text-right`}>CAC</TableHead>
              <TableHead className={`${th} text-right`}>ROI</TableHead>
              <TableHead className={`${th} text-right`}>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={13} className="text-center text-white/40 text-[12px] py-8">
                  Carregando...
                </TableCell>
              </TableRow>
            )}
            {!loading && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={13} className="text-center text-white/40 text-[12px] py-8">
                  Nenhuma campanha.
                </TableCell>
              </TableRow>
            )}
            {filtered.map(({ campaign, metrics }) => {
              const today = new Date(); today.setHours(0, 0, 0, 0);
              const isFinished = !!campaign.end_date && new Date(campaign.end_date) < today;
              return (
                <TableRow
                  key={campaign.id}
                  className="border-white/[0.04] cursor-pointer hover:bg-white/[0.03] transition-colors"
                  onClick={() => { setDetailsTarget(campaign); setDetailsOpen(true); }}
                >
                  <TableCell>
                    {isFinished ? (
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.14em] px-2 py-0.5 rounded-full bg-white/[0.06] text-white/70 ring-1 ring-white/10">
                        <CheckCircle2 className="h-3 w-3" /> Finalizada
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.14em] px-2 py-0.5 rounded-full bg-emerald-400/10 text-emerald-300 ring-1 ring-emerald-400/25">
                        <CircleDot className="h-3 w-3 animate-pulse" /> Ativa
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-[13px] text-white font-medium">{campaign.name}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center text-[11px] px-2 py-0.5 rounded-full bg-white/[0.05] text-white/75 ring-1 ring-white/10">
                      {campaign.platform}
                    </span>
                  </TableCell>
                  <TableCell className="text-[11px] text-white/55">
                    {new Date(campaign.start_date).toLocaleDateString("pt-BR")}
                    {campaign.end_date && ` → ${new Date(campaign.end_date).toLocaleDateString("pt-BR")}`}
                  </TableCell>
                  <TableCell className="text-[12px] text-white/75 text-right tabular-nums">{fmtMoney(Number(campaign.total_budget))}</TableCell>
                  <TableCell className="text-[12px] text-red-300/90 text-right tabular-nums">{fmtMoney(metrics.totalSpent)}</TableCell>
                  <TableCell className="text-[12px] text-white/75 text-right tabular-nums">{metrics.totalLeads}</TableCell>
                  <TableCell className="text-[12px] text-white/75 text-right tabular-nums">{metrics.totalSales}</TableCell>
                  <TableCell className="text-[12px] text-emerald-300/90 text-right tabular-nums">{fmtMoney(metrics.totalRevenue)}</TableCell>
                  <TableCell className="text-[12px] text-white/70 text-right tabular-nums">{fmtMoney(metrics.cpl)}</TableCell>
                  <TableCell className="text-[12px] text-white/70 text-right tabular-nums">{fmtMoney(metrics.cac)}</TableCell>
                  <TableCell
                    className={`text-[12px] text-right tabular-nums ${
                      metrics.roi != null && metrics.roi >= 0 ? "text-emerald-300" : "text-red-300"
                    }`}
                  >
                    {fmtPct(metrics.roi)}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-white/60 hover:text-white hover:bg-white/[0.06]"
                        title="Detalhes"
                        onClick={() => { setDetailsTarget(campaign); setDetailsOpen(true); }}
                      >
                        <BarChart3 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-white/60 hover:text-white hover:bg-white/[0.06]"
                        title="Editar"
                        onClick={() => { setEditTarget(campaign); setEditOpen(true); }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-red-300/80 hover:text-red-300 hover:bg-red-400/10"
                        title="Excluir"
                        onClick={() => setDeleteId(campaign.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <CampaignFormDialog open={editOpen} onOpenChange={setEditOpen} campaign={editTarget} onSaved={onRefresh} />
      <CampaignDetailsDialog open={detailsOpen} onOpenChange={setDetailsOpen} campaign={detailsTarget} onChanged={onRefresh} />

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent className="bg-[#0c0c0e] border-white/[0.06]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white font-light">Excluir campanha?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/50">
              Todos os custos e resultados associados também serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/[0.04] border-white/[0.06] text-white/80 hover:bg-white/[0.08]">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-400/20 text-red-200 hover:bg-red-400/30 ring-1 ring-red-400/25"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
