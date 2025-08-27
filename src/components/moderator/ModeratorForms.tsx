
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Eye, Search, Filter, Download, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RegistrationForm {
  id: string;
  artistic_name: string | null;
  email: string;
  full_name: string;
  cpf: string;
  birth_date: string;
  cep: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export const ModeratorForms = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedForm, setSelectedForm] = useState<RegistrationForm | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const { data: forms, isLoading } = useQuery({
    queryKey: ['public-registration-forms'],
    queryFn: async (): Promise<RegistrationForm[]> => {
      const { data, error } = await supabase
        .from('public_registration_forms')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar formulários:', error);
        throw error;
      }

      return data || [];
    },
  });

  const filteredForms = forms?.filter(form => 
    form.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    form.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    form.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (form.artistic_name && form.artistic_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleViewDetails = (form: RegistrationForm) => {
    setSelectedForm(form);
    setIsDetailsModalOpen(true);
  };

  const formatCPF = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatPhone = (phone: string | null) => {
    if (!phone) return '-';
    return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  const exportToCSV = () => {
    if (!forms || forms.length === 0) return;

    const headers = [
      'Nome Completo',
      'Nome Artístico',
      'Email',
      'CPF',
      'Data de Nascimento',
      'Telefone',
      'CEP',
      'Endereço',
      'Número',
      'Bairro',
      'Cidade',
      'Estado',
      'Data de Cadastro'
    ];

    const csvContent = [
      headers.join(','),
      ...forms.map(form => [
        `"${form.full_name}"`,
        `"${form.artistic_name || ''}"`,
        `"${form.email}"`,
        `"${formatCPF(form.cpf)}"`,
        `"${format(new Date(form.birth_date), 'dd/MM/yyyy')}"`,
        `"${form.phone || ''}"`,
        `"${form.cep}"`,
        `"${form.street}"`,
        `"${form.number}"`,
        `"${form.neighborhood}"`,
        `"${form.city}"`,
        `"${form.state}"`,
        `"${format(new Date(form.created_at), 'dd/MM/yyyy HH:mm')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `formularios_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Formulários Recebidos</h2>
          <p className="text-muted-foreground">
            Formulários de cadastro enviados pelos usuários
          </p>
        </div>
        <Button onClick={exportToCSV} variant="outline" disabled={!forms || forms.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Filtros e Busca */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Buscar e Filtrar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por nome, email, cidade ou nome artístico..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Formulários</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{forms?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Com Nome Artístico</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {forms?.filter(f => f.artistic_name).length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hoje</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {forms?.filter(f => 
                format(new Date(f.created_at), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
              ).length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Formulários */}
      <Card>
        <CardHeader>
          <CardTitle>Formulários ({filteredForms?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Carregando formulários...</div>
          ) : filteredForms && filteredForms.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome Completo</TableHead>
                    <TableHead>Nome Artístico</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Cidade</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredForms.map((form) => (
                    <TableRow key={form.id}>
                      <TableCell className="font-medium">{form.full_name}</TableCell>
                      <TableCell>
                        {form.artistic_name ? (
                          <Badge variant="secondary">{form.artistic_name}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{form.email}</TableCell>
                      <TableCell>{form.city}, {form.state}</TableCell>
                      <TableCell>
                        {format(new Date(form.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 justify-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(form)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'Nenhum formulário encontrado para a busca' : 'Nenhum formulário encontrado'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Detalhes */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Formulário</DialogTitle>
          </DialogHeader>
          {selectedForm && (
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Nome Completo</label>
                  <p className="text-sm">{selectedForm.full_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Nome Artístico</label>
                  <p className="text-sm">{selectedForm.artistic_name || 'Não informado'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="text-sm">{selectedForm.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">CPF</label>
                  <p className="text-sm">{formatCPF(selectedForm.cpf)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Data de Nascimento</label>
                  <p className="text-sm">
                    {format(new Date(selectedForm.birth_date), 'dd/MM/yyyy', { locale: ptBR })}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Telefone</label>
                  <p className="text-sm">{formatPhone(selectedForm.phone)}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Endereço Completo</label>
                <p className="text-sm">
                  {selectedForm.street}, {selectedForm.number} - {selectedForm.neighborhood}
                  <br />
                  {selectedForm.city}, {selectedForm.state} - CEP: {selectedForm.cep}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Data de Cadastro</label>
                <p className="text-sm">
                  {format(new Date(selectedForm.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
