# Gestão de Marketing — Painel Admin

Nova área no admin para criar e gerir campanhas de marketing, registrar custos/resultados e visualizar métricas (CPL, CAC, ROI).

## Banco de dados (migration)

Três tabelas novas em `public`, todas com RLS restrita a admins (via `is_user_admin(auth.uid())`):

1. **`marketing_campaigns`**
   - `name`, `platform` (text), `start_date`, `end_date`, `total_budget` (numeric), `notes`, `created_by` (uuid), `created_at`, `updated_at`.

2. **`marketing_campaign_costs`**
   - `campaign_id` → campaigns, `description`, `amount` (numeric), `cost_date`, `created_at`.

3. **`marketing_campaign_results`**
   - `campaign_id` → campaigns, `result_date`, `leads` (int), `sales` (int), `revenue` (numeric), `impressions` (int, opcional), `clicks` (int, opcional), `cpm` (numeric, opcional), `ctr` (numeric, opcional), `created_at`.

GRANTs: `authenticated` (SELECT/INSERT/UPDATE/DELETE), `service_role` ALL. Policies: somente admins (`is_user_admin(auth.uid())`) podem ler/escrever.

Triggers de `updated_at` em `marketing_campaigns`.

## Frontend

### Roteamento e acesso
- Adicionar item **"Marketing"** (ícone `Megaphone`) em `src/components/admin/AdminSidebar.tsx` com `id: "marketing"`.
- Em `src/pages/AdminDashboard.tsx` (renderiza tabs do admin): registrar a tab `marketing` que carrega o novo componente. Acesso já é protegido por `useAdminAccess`.

### Componentes novos (em `src/components/admin/marketing/`)
- `MarketingDashboard.tsx` — container com tabs internas: **Visão Geral** | **Campanhas**.
- `MarketingOverview.tsx` — KPIs agregados (CPL, CAC, ROI, gasto total, receita total) + gráficos (Recharts já existe): linha de ROI/CPL/CAC ao longo do tempo, barras de gasto vs receita por campanha. Filtros: período (date range), plataforma.
- `CampaignsList.tsx` — tabela com colunas: Nome, Plataforma, Período, Orçamento, Gasto, Leads, Vendas, Receita, CPL, CAC, ROI. Ações: ver detalhes, editar, excluir. Filtros de plataforma e período.
- `CampaignFormDialog.tsx` — dialog para criar/editar campanha (zod + react-hook-form).
- `CampaignDetailsDialog.tsx` — detalhes com sub-abas: **Custos** e **Resultados**, cada uma com lista + form de adicionar registro.
- `CostFormDialog.tsx` / `ResultFormDialog.tsx` — dialogs simples.

### Service
- `src/services/marketingService.ts` — CRUD para campanhas, custos e resultados via `supabase` client; helper `computeMetrics(campaign, costs, results)` retornando `{ totalSpent, totalLeads, totalSales, totalRevenue, cpl, cac, roi }`.

### Hook
- `src/hooks/useMarketingCampaigns.tsx` — busca campanhas + agrega custos/resultados em uma única chamada (com filtros opcionais).

## Métricas (cálculo no cliente)
- `CPL = totalSpent / totalLeads` (guard para 0)
- `CAC = totalSpent / totalSales`
- `ROI = ((totalRevenue - totalSpent) / totalSpent) * 100`
- CPM/CTR exibidos quando preenchidos manualmente nos resultados.

## Fora de escopo (não alterar)
Nada em registros, checkout, sidebar do usuário, ou outros painéis. Apenas adições isoladas.