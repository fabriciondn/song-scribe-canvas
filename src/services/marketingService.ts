import { supabase } from "@/integrations/supabase/client";

export interface Campaign {
  id: string;
  name: string;
  platform: string;
  start_date: string;
  end_date: string | null;
  total_budget: number;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CampaignCost {
  id: string;
  campaign_id: string;
  description: string;
  amount: number;
  cost_date: string;
  created_at: string;
}

export interface CampaignResult {
  id: string;
  campaign_id: string;
  result_date: string;
  leads: number;
  sales: number;
  revenue: number;
  impressions: number | null;
  clicks: number | null;
  cpm: number | null;
  ctr: number | null;
  created_at: string;
}

export interface CampaignMetrics {
  totalSpent: number;
  totalLeads: number;
  totalSales: number;
  totalRevenue: number;
  cpl: number | null;
  cac: number | null;
  roi: number | null;
}

export interface CampaignAggregate {
  campaign: Campaign;
  costs: CampaignCost[];
  results: CampaignResult[];
  metrics: CampaignMetrics;
}

export function computeMetrics(
  campaign: Campaign,
  costs: CampaignCost[],
  results: CampaignResult[]
): CampaignMetrics {
  const totalSpent = costs.reduce((s, c) => s + Number(c.amount || 0), 0);
  const totalLeads = results.reduce((s, r) => s + (r.leads || 0), 0);
  const totalSales = results.reduce((s, r) => s + (r.sales || 0), 0);
  const totalRevenue = results.reduce((s, r) => s + Number(r.revenue || 0), 0);
  return {
    totalSpent,
    totalLeads,
    totalSales,
    totalRevenue,
    cpl: totalLeads > 0 && totalSpent > 0 ? totalSpent / totalLeads : null,
    cac: totalSales > 0 && totalSpent > 0 ? totalSpent / totalSales : null,
    roi: totalSpent > 0 ? ((totalRevenue - totalSpent) / totalSpent) * 100 : null,
  };
}

export const marketingService = {
  async listCampaigns(): Promise<Campaign[]> {
    const { data, error } = await supabase
      .from("marketing_campaigns")
      .select("*")
      .order("start_date", { ascending: false });
    if (error) throw error;
    return (data || []) as Campaign[];
  },

  async createCampaign(
    payload: Omit<Campaign, "id" | "created_at" | "updated_at" | "created_by">
  ): Promise<Campaign> {
    const { data: userData } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("marketing_campaigns")
      .insert({ ...payload, created_by: userData.user?.id ?? null })
      .select()
      .single();
    if (error) throw error;
    return data as Campaign;
  },

  async updateCampaign(id: string, payload: Partial<Campaign>): Promise<Campaign> {
    const { data, error } = await supabase
      .from("marketing_campaigns")
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as Campaign;
  },

  async deleteCampaign(id: string): Promise<void> {
    const { error } = await supabase.from("marketing_campaigns").delete().eq("id", id);
    if (error) throw error;
  },

  async listCosts(campaignId: string): Promise<CampaignCost[]> {
    const { data, error } = await supabase
      .from("marketing_campaign_costs")
      .select("*")
      .eq("campaign_id", campaignId)
      .order("cost_date", { ascending: false });
    if (error) throw error;
    return (data || []) as CampaignCost[];
  },

  async addCost(payload: Omit<CampaignCost, "id" | "created_at">): Promise<CampaignCost> {
    const { data, error } = await supabase
      .from("marketing_campaign_costs")
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data as CampaignCost;
  },

  async updateCost(id: string, payload: Partial<CampaignCost>): Promise<CampaignCost> {
    const { data, error } = await supabase
      .from("marketing_campaign_costs")
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as CampaignCost;
  },

  async deleteCost(id: string): Promise<void> {
    const { error } = await supabase.from("marketing_campaign_costs").delete().eq("id", id);
    if (error) throw error;
  },

  async listResults(campaignId: string): Promise<CampaignResult[]> {
    const { data, error } = await supabase
      .from("marketing_campaign_results")
      .select("*")
      .eq("campaign_id", campaignId)
      .order("result_date", { ascending: false });
    if (error) throw error;
    return (data || []) as CampaignResult[];
  },

  async addResult(
    payload: Omit<CampaignResult, "id" | "created_at">
  ): Promise<CampaignResult> {
    const { data, error } = await supabase
      .from("marketing_campaign_results")
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data as CampaignResult;
  },

  async updateResult(id: string, payload: Partial<CampaignResult>): Promise<CampaignResult> {
    const { data, error } = await supabase
      .from("marketing_campaign_results")
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as CampaignResult;
  },

  async deleteResult(id: string): Promise<void> {
    const { error } = await supabase
      .from("marketing_campaign_results")
      .delete()
      .eq("id", id);
    if (error) throw error;
  },

  async listAllAggregates(): Promise<CampaignAggregate[]> {
    const campaigns = await this.listCampaigns();
    if (campaigns.length === 0) return [];
    const ids = campaigns.map((c) => c.id);
    const [{ data: costs, error: ce }, { data: results, error: re }] = await Promise.all([
      supabase.from("marketing_campaign_costs").select("*").in("campaign_id", ids),
      supabase.from("marketing_campaign_results").select("*").in("campaign_id", ids),
    ]);
    if (ce) throw ce;
    if (re) throw re;
    return campaigns.map((campaign) => {
      const c = ((costs || []) as CampaignCost[]).filter((x) => x.campaign_id === campaign.id);
      const r = ((results || []) as CampaignResult[]).filter((x) => x.campaign_id === campaign.id);
      return { campaign, costs: c, results: r, metrics: computeMetrics(campaign, c, r) };
    });
  },
};
