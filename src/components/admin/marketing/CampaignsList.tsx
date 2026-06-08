import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, BarChart3 } from "lucide-react";
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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
        <CardTitle>Campanhas</CardTitle>
        <div className="flex gap-2 flex-wrap">
          <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-48" />
          <Select value={platform} onValueChange={setPlatform}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as plataformas</SelectItem>
              {platforms.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={() => { setEditTarget(null); setEditOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" /> Nova campanha
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Plataforma</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Orçamento diário</TableHead>
                <TableHead>Gasto total</TableHead>
                <TableHead>Leads</TableHead>
                <TableHead>Vendas</TableHead>
                <TableHead>Receita</TableHead>
                <TableHead>CPL</TableHead>
                <TableHead>CAC</TableHead>
                <TableHead>ROI</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && <TableRow><TableCell colSpan={12} className="text-center">Carregando...</TableCell></TableRow>}
              {!loading && filtered.length === 0 && <TableRow><TableCell colSpan={12} className="text-center text-muted-foreground">Nenhuma campanha.</TableCell></TableRow>}
              {filtered.map(({ campaign, metrics }) => (
                <TableRow
                  key={campaign.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => { setDetailsTarget(campaign); setDetailsOpen(true); }}
                >
                  <TableCell className="font-medium">{campaign.name}</TableCell>
                  <TableCell><Badge variant="secondary">{campaign.platform}</Badge></TableCell>
                  <TableCell className="text-xs">
                    {new Date(campaign.start_date).toLocaleDateString("pt-BR")}
                    {campaign.end_date && ` → ${new Date(campaign.end_date).toLocaleDateString("pt-BR")}`}
                  </TableCell>
                  <TableCell>{fmtMoney(Number(campaign.total_budget))}</TableCell>
                  <TableCell>{fmtMoney(metrics.totalSpent)}</TableCell>
                  <TableCell>{metrics.totalLeads}</TableCell>
                  <TableCell>{metrics.totalSales}</TableCell>
                  <TableCell>{fmtMoney(metrics.totalRevenue)}</TableCell>
                  <TableCell>{fmtMoney(metrics.cpl)}</TableCell>
                  <TableCell>{fmtMoney(metrics.cac)}</TableCell>
                  <TableCell className={metrics.roi != null && metrics.roi >= 0 ? "text-green-600" : "text-red-600"}>
                    {fmtPct(metrics.roi)}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" title="Detalhes" onClick={() => { setDetailsTarget(campaign); setDetailsOpen(true); }}>
                        <BarChart3 className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" title="Editar" onClick={() => { setEditTarget(campaign); setEditOpen(true); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" title="Excluir" onClick={() => setDeleteId(campaign.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <CampaignFormDialog open={editOpen} onOpenChange={setEditOpen} campaign={editTarget} onSaved={onRefresh} />
      <CampaignDetailsDialog open={detailsOpen} onOpenChange={setDetailsOpen} campaign={detailsTarget} onChanged={onRefresh} />

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir campanha?</AlertDialogTitle>
            <AlertDialogDescription>Todos os custos e resultados associados também serão removidos.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
