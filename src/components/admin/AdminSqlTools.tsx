import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Database, Search, Link2, AlertTriangle, Play, Copy } from 'lucide-react';

export const AdminSqlTools: React.FC = () => {
  const exampleSql = "SELECT p.name, p.email, a.role, a.permissions\nFROM public.profiles p\nLEFT JOIN public.admin_users a ON a.user_id = p.id\nWHERE LOWER(p.email) = 'felipenedino88@gmail.com';";
  const [sql, setSql] = useState(exampleSql);
  const [sqlResult, setSqlResult] = useState<{ columns: string[]; rows: Record<string, unknown>[]; rowCount: number } | null>(null);
  const [sqlError, setSqlError] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [partnerEmail, setPartnerEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  const getAuthHeaders = async () => {
    let { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session?.access_token) {
      const refreshed = await supabase.auth.refreshSession();
      session = refreshed.data.session;
      error = refreshed.error;
    }
    if (error || !session?.access_token) {
      throw new Error('Sessão não encontrada. Faça login novamente no painel administrativo.');
    }
    return { Authorization: `Bearer ${session.access_token}` };
  };

  const executeSql = async () => {
    if (!sql.trim()) return toast.error('Cole uma consulta SQL');
    setBusy(true);
    setSqlError('');
    setSqlResult(null);
    try {
      const headers = await getAuthHeaders();
      const { data, error } = await supabase.functions.invoke('admin-sql-tools', {
        headers,
        body: { action: 'run_sql', sql },
      });
      if (error) {
        let message = error.message;
        if (error.context instanceof Response) {
          try { message = (await error.context.clone().json())?.error || message; } catch { /* ignore */ }
        }
        throw new Error(message);
      }
      setSqlResult(data);
      toast.success('Consulta concluída');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao consultar';
      setSqlError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  const run = async (action: 'check_partner_link' | 'assign_partner_link') => {
    if (!clientEmail.trim() || !partnerEmail.trim()) {
      toast.error('Informe os dois e-mails');
      return;
    }
    if (action === 'assign_partner_link' && !window.confirm('Confirma vincular este cliente ao parceiro informado? Esta alteração será salva no banco de produção.')) return;
    setBusy(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('admin-sql-tools', {
        body: { action, clientEmail: clientEmail.trim(), partnerEmail: partnerEmail.trim() },
      });
      if (error) {
        let message = error.message;
        if (error.context instanceof Response) {
          try { message = (await error.context.clone().json())?.error || message; } catch { /* ignore */ }
        }
        throw new Error(message);
      }
      setResult(data);
      if (action === 'assign_partner_link') toast.success(data?.message || 'Operação concluída');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error(message);
      setResult({ error: message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Database className="h-5 w-5" /> Teste SQL</CardTitle>
        <CardDescription>Ferramentas administrativas seguras para consultar e corrigir vínculos de parceiros sem abrir o Supabase.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-sm">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>Banco de produção. O editor aceita apenas a consulta de diagnóstico autorizada. Scripts livres e comandos de alteração não são executados.</span>
        </div>
        <div className="space-y-3 rounded-lg border p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <Label htmlFor="sql-editor" className="text-base font-semibold">Editor de consultas SQL</Label>
              <p className="text-xs text-muted-foreground mt-1">Cole a consulta de diagnóstico de perfil e permissões. Outras instruções não são executadas.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setSql(exampleSql)} disabled={busy}>Exemplo: Felipe</Button>
          </div>
          <Textarea id="sql-editor" value={sql} onChange={(e) => setSql(e.target.value)}
            className="min-h-[180px] font-mono text-sm resize-y" spellCheck={false} placeholder="Cole aqui sua consulta SELECT..." />
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={executeSql} disabled={busy || !sql.trim()}><Play className="mr-2 h-4 w-4" /> {busy ? 'Executando...' : 'Executar consulta'}</Button>
            <Button variant="outline" disabled={!sqlResult} onClick={() => navigator.clipboard.writeText(JSON.stringify(sqlResult?.rows ?? [], null, 2))}><Copy className="mr-2 h-4 w-4" /> Copiar resultado</Button>
          </div>
          {sqlError && <p role="alert" className="text-sm text-destructive">{sqlError}</p>}
          {sqlResult && <div className="space-y-2">
            <p className="text-xs text-muted-foreground">{sqlResult.rowCount} registro(s) encontrado(s)</p>
            <div className="max-w-full overflow-x-auto rounded-md border">
              <table className="w-full text-left text-sm">
                <thead><tr className="border-b bg-muted/30">{sqlResult.columns.map((col) => <th key={col} className="p-3 font-medium">{col}</th>)}</tr></thead>
                <tbody>{sqlResult.rows.map((row, index) => <tr key={index} className="border-b last:border-0">{sqlResult.columns.map((col) => <td key={col} className="p-3 align-top break-words">{typeof row[col] === 'object' ? JSON.stringify(row[col]) : String(row[col] ?? 'NULL')}</td>)}</tr>)}</tbody>
              </table>
            </div>
          </div>}
        </div>
        <div className="border-t pt-4 space-y-2"><h3 className="font-semibold">Vínculos de parceiros</h3><p className="text-xs text-muted-foreground">Verifique ou cadastre o vínculo de um cliente com um parceiro.</p></div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2"><Label htmlFor="sql-client-email">E-mail do cliente</Label><Input id="sql-client-email" type="email" placeholder="cliente@exemplo.com" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} /></div>
          <div className="space-y-2"><Label htmlFor="sql-partner-email">E-mail do parceiro</Label><Input id="sql-partner-email" type="email" placeholder="parceiro@exemplo.com" value={partnerEmail} onChange={(e) => setPartnerEmail(e.target.value)} /></div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" disabled={busy} onClick={() => run('check_partner_link')}><Search className="mr-2 h-4 w-4" /> Verificar vínculo</Button>
          <Button disabled={busy} onClick={() => run('assign_partner_link')}><Link2 className="mr-2 h-4 w-4" /> Vincular ao parceiro</Button>
        </div>
        {result && <div className="rounded-md border p-3 space-y-2">
          <Badge variant={result.error ? 'destructive' : 'secondary'}>{result.error ? 'Erro' : 'Resultado'}</Badge>
          <pre className="text-xs whitespace-pre-wrap break-words">{JSON.stringify(result, null, 2)}</pre>
        </div>}
      </CardContent>
    </Card>
  );
};
