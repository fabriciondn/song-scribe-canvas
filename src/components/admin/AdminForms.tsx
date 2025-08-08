import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Search, Eye, Calendar, User, Mail, Phone, MapPin } from 'lucide-react';
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
  created_at: string;
}

export const AdminForms: React.FC = () => {
  const [forms, setForms] = useState<RegistrationForm[]>([]);
  const [filteredForms, setFilteredForms] = useState<RegistrationForm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedForm, setSelectedForm] = useState<RegistrationForm | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchForms();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = forms.filter(form => 
        form.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        form.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (form.artistic_name && form.artistic_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredForms(filtered);
    } else {
      setFilteredForms(forms);
    }
  }, [searchTerm, forms]);

  const fetchForms = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('public_registration_forms')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setForms(data || []);
      setFilteredForms(data || []);
    } catch (error) {
      console.error('Erro ao carregar formulários:', error);
      toast.error('Erro ao carregar formulários');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCpf = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatCep = (cep: string) => {
    return cep.replace(/(\d{5})(\d{3})/, '$1-$2');
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy às HH:mm', { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const handleViewForm = (form: RegistrationForm) => {
    setSelectedForm(form);
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Formulários de Registro</h2>
        <Badge variant="secondary" className="text-sm">
          {forms.length} formulário{forms.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4" />
            <Input
              placeholder="Buscar por nome, e-mail ou nome artístico..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredForms.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'Nenhum formulário encontrado com esses termos de busca.' : 'Nenhum formulário recebido ainda.'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Nome Artístico</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Data de Envio</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredForms.map((form) => (
                  <TableRow key={form.id}>
                    <TableCell className="font-medium">{form.full_name}</TableCell>
                    <TableCell>
                      {form.artistic_name || (
                        <span className="text-muted-foreground italic">Não informado</span>
                      )}
                    </TableCell>
                    <TableCell>{form.email}</TableCell>
                    <TableCell>{formatDateTime(form.created_at)}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewForm(form)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Visualizar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Formulário</DialogTitle>
            <DialogDescription>
              Informações completas do formulário de registro
            </DialogDescription>
          </DialogHeader>
          
          {selectedForm && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Nome Completo</span>
                  </div>
                  <p className="text-sm pl-6">{selectedForm.full_name}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Nome Artístico</span>
                  </div>
                  <p className="text-sm pl-6">
                    {selectedForm.artistic_name || (
                      <span className="text-muted-foreground italic">Não informado</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">E-mail</span>
                  </div>
                  <p className="text-sm pl-6">{selectedForm.email}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Data de Nascimento</span>
                  </div>
                  <p className="text-sm pl-6">{formatDate(selectedForm.birth_date)}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">CPF</span>
                </div>
                <p className="text-sm pl-6">{formatCpf(selectedForm.cpf)}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Endereço</span>
                </div>
                <div className="text-sm pl-6 space-y-1">
                  <p>{selectedForm.street}, {selectedForm.number}</p>
                  <p>{selectedForm.neighborhood}</p>
                  <p>{selectedForm.city} - {selectedForm.state}</p>
                  <p>CEP: {formatCep(selectedForm.cep)}</p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="text-xs text-muted-foreground">
                  Formulário enviado em: {formatDateTime(selectedForm.created_at)}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};