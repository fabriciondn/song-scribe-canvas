import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Pencil, Trash2, Ticket, Loader2, Users, Calendar, Percent } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_percentage: number;
  max_uses: number | null;
  current_uses: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  applies_to: string[];
  created_at: string;
}

interface CouponFormData {
  code: string;
  description: string;
  discount_percentage: number;
  max_uses: string;
  valid_until: string;
  is_active: boolean;
  applies_to: string[];
}

const defaultFormData: CouponFormData = {
  code: '',
  description: '',
  discount_percentage: 10,
  max_uses: '',
  valid_until: '',
  is_active: true,
  applies_to: ['pendrive', 'pro'],
};

export function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState<CouponFormData>(defaultFormData);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('discount_coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCoupons((data as Coupon[]) || []);
    } catch (error) {
      console.error('Erro ao buscar cupons:', error);
      toast.error('Erro ao carregar cupons');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (coupon?: Coupon) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setFormData({
        code: coupon.code,
        description: coupon.description || '',
        discount_percentage: coupon.discount_percentage,
        max_uses: coupon.max_uses?.toString() || '',
        valid_until: coupon.valid_until ? coupon.valid_until.split('T')[0] : '',
        is_active: coupon.is_active,
        applies_to: coupon.applies_to || ['pendrive', 'pro'],
      });
    } else {
      setEditingCoupon(null);
      setFormData(defaultFormData);
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.code.trim()) {
      toast.error('Código do cupom é obrigatório');
      return;
    }

    if (formData.discount_percentage <= 0 || formData.discount_percentage > 100) {
      toast.error('Desconto deve ser entre 1% e 100%');
      return;
    }

    setIsSaving(true);
    try {
      const couponData = {
        code: formData.code.toUpperCase().trim(),
        description: formData.description || null,
        discount_percentage: formData.discount_percentage,
        max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
        valid_until: formData.valid_until || null,
        is_active: formData.is_active,
        applies_to: formData.applies_to,
      };

      if (editingCoupon) {
        const { error } = await supabase
          .from('discount_coupons')
          .update(couponData)
          .eq('id', editingCoupon.id);

        if (error) throw error;
        toast.success('Cupom atualizado com sucesso');
      } else {
        const { error } = await supabase
          .from('discount_coupons')
          .insert(couponData);

        if (error) {
          if (error.code === '23505') {
            toast.error('Já existe um cupom com este código');
            return;
          }
          throw error;
        }
        toast.success('Cupom criado com sucesso');
      }

      setIsDialogOpen(false);
      fetchCoupons();
    } catch (error) {
      console.error('Erro ao salvar cupom:', error);
      toast.error('Erro ao salvar cupom');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (couponId: string) => {
    if (!confirm('Tem certeza que deseja excluir este cupom?')) return;

    try {
      const { error } = await supabase
        .from('discount_coupons')
        .delete()
        .eq('id', couponId);

      if (error) throw error;
      toast.success('Cupom excluído com sucesso');
      fetchCoupons();
    } catch (error) {
      console.error('Erro ao excluir cupom:', error);
      toast.error('Erro ao excluir cupom');
    }
  };

  const handleToggleActive = async (coupon: Coupon) => {
    try {
      const { error } = await supabase
        .from('discount_coupons')
        .update({ is_active: !coupon.is_active })
        .eq('id', coupon.id);

      if (error) throw error;
      toast.success(coupon.is_active ? 'Cupom desativado' : 'Cupom ativado');
      fetchCoupons();
    } catch (error) {
      console.error('Erro ao atualizar cupom:', error);
      toast.error('Erro ao atualizar cupom');
    }
  };

  const getCouponStatus = (coupon: Coupon) => {
    if (!coupon.is_active) return { label: 'Inativo', variant: 'secondary' as const };
    if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) {
      return { label: 'Expirado', variant: 'destructive' as const };
    }
    if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) {
      return { label: 'Esgotado', variant: 'destructive' as const };
    }
    return { label: 'Ativo', variant: 'default' as const };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Cupons de Desconto</h2>
          <p className="text-muted-foreground">Gerencie os cupons de desconto da plataforma</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Cupom
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Cupons</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{coupons.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Cupons Ativos</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {coupons.filter(c => c.is_active && (!c.valid_until || new Date(c.valid_until) > new Date())).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Usos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {coupons.reduce((acc, c) => acc + c.current_uses, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Coupons Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Cupons</CardTitle>
          <CardDescription>Todos os cupons cadastrados</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : coupons.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum cupom cadastrado
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Desconto</TableHead>
                  <TableHead>Usos</TableHead>
                  <TableHead>Validade</TableHead>
                  <TableHead>Aplica-se a</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map((coupon) => {
                  const status = getCouponStatus(coupon);
                  return (
                    <TableRow key={coupon.id}>
                      <TableCell className="font-mono font-bold">{coupon.code}</TableCell>
                      <TableCell>{coupon.discount_percentage}%</TableCell>
                      <TableCell>
                        {coupon.current_uses}
                        {coupon.max_uses && ` / ${coupon.max_uses}`}
                      </TableCell>
                      <TableCell>
                        {coupon.valid_until 
                          ? format(new Date(coupon.valid_until), 'dd/MM/yyyy', { locale: ptBR })
                          : 'Sem limite'
                        }
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {coupon.applies_to?.map(type => (
                            <Badge key={type} variant="outline" className="text-xs">
                              {type === 'pendrive' ? 'Pendrive' : 'Pro'}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(coupon)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleActive(coupon)}
                          >
                            <Switch checked={coupon.is_active} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(coupon.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingCoupon ? 'Editar Cupom' : 'Novo Cupom'}</DialogTitle>
            <DialogDescription>
              {editingCoupon ? 'Edite as informações do cupom' : 'Crie um novo cupom de desconto'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="code">Código do Cupom</Label>
              <Input
                id="code"
                placeholder="Ex: PROMO10"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="uppercase"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Descrição (opcional)</Label>
              <Input
                id="description"
                placeholder="Ex: Promoção de lançamento"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="discount">Desconto (%)</Label>
                <Input
                  id="discount"
                  type="number"
                  min="1"
                  max="100"
                  value={formData.discount_percentage}
                  onChange={(e) => setFormData({ ...formData, discount_percentage: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="max_uses">Limite de Usos</Label>
                <Input
                  id="max_uses"
                  type="number"
                  min="1"
                  placeholder="Ilimitado"
                  value={formData.max_uses}
                  onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="valid_until">Válido até (opcional)</Label>
              <Input
                id="valid_until"
                type="date"
                value={formData.valid_until}
                onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label>Aplica-se a</Label>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="applies_pendrive"
                    checked={formData.applies_to.includes('pendrive')}
                    onCheckedChange={(checked) => {
                      const newApplies = checked 
                        ? [...formData.applies_to, 'pendrive']
                        : formData.applies_to.filter(t => t !== 'pendrive');
                      setFormData({ ...formData, applies_to: newApplies });
                    }}
                  />
                  <Label htmlFor="applies_pendrive" className="font-normal">Pendrive</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="applies_pro"
                    checked={formData.applies_to.includes('pro')}
                    onCheckedChange={(checked) => {
                      const newApplies = checked 
                        ? [...formData.applies_to, 'pro']
                        : formData.applies_to.filter(t => t !== 'pro');
                      setFormData({ ...formData, applies_to: newApplies });
                    }}
                  />
                  <Label htmlFor="applies_pro" className="font-normal">Pro</Label>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">Cupom ativo</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingCoupon ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}