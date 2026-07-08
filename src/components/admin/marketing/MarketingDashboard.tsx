import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMarketingCampaigns } from "@/hooks/useMarketingCampaigns";
import { MarketingOverview } from "./MarketingOverview";
import { CampaignsList } from "./CampaignsList";

export function MarketingDashboard() {
  const { data, loading, refresh } = useMarketingCampaigns();

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
          <span className="text-[10px] uppercase tracking-[0.18em] text-white/45">Growth</span>
        </div>
        <h2 className="mt-1.5 text-white text-2xl font-light tracking-tight">Marketing</h2>
        <p className="mt-1 text-[12px] text-white/45">
          Campanhas, custos, resultados e métricas de ROI.
        </p>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="bg-white/[0.03] border border-white/[0.06] h-9 rounded-lg p-1">
          <TabsTrigger
            value="overview"
            className="text-[11px] text-white/55 data-[state=active]:bg-white/[0.08] data-[state=active]:text-white rounded-md"
          >
            Visão Geral
          </TabsTrigger>
          <TabsTrigger
            value="campaigns"
            className="text-[11px] text-white/55 data-[state=active]:bg-white/[0.08] data-[state=active]:text-white rounded-md"
          >
            Campanhas
          </TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-4">
          <MarketingOverview aggregates={data} />
        </TabsContent>
        <TabsContent value="campaigns" className="mt-4">
          <CampaignsList aggregates={data} loading={loading} onRefresh={refresh} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
