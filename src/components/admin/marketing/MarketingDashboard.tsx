import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMarketingCampaigns } from "@/hooks/useMarketingCampaigns";
import { MarketingOverview } from "./MarketingOverview";
import { CampaignsList } from "./CampaignsList";
import { Megaphone } from "lucide-react";

export function MarketingDashboard() {
  const { data, loading, refresh } = useMarketingCampaigns();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Megaphone className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">Gestão de Marketing</h2>
          <p className="text-sm text-muted-foreground">Campanhas, custos, resultados e métricas de ROI.</p>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="campaigns">Campanhas</TabsTrigger>
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
