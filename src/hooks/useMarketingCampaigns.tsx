import { useCallback, useEffect, useState } from "react";
import { marketingService, CampaignAggregate } from "@/services/marketingService";

export function useMarketingCampaigns() {
  const [data, setData] = useState<CampaignAggregate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await marketingService.listAllAggregates();
      setData(result);
    } catch (e: any) {
      setError(e?.message ?? "Erro ao carregar campanhas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}
