import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Database, Search, Link2, AlertTriangle } from 'lucide-react';

export const AdminSqlTools: React.FC = () => {
  const [clientEmail, setClientEmail] = useState('');
  const [partnerEmail, setPartnerEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

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
          <span>Banco de produção. Por segurança, comandos SQL livres (DROP, UPDATE, DELETE ou scripts arbitrários) não são executados. Utilize as operações verificadas abaixo.</span>
        </div>
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
