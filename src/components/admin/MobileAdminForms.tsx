import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ChevronLeft, Search, Mail, Calendar, Eye, UserPlus, Loader2, Lock, Phone, MapPin, User } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { DataMask } from '@/components/ui/data-mask';

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
  password: string | null;
  created_at: string;
}

interface MobileAdminFormsProps {
  onBack: () => void;
}

export const MobileAdminForms: React.FC<MobileAdminFormsProps> = ({ onBack }) => {
  const [forms, setForms] = useState<RegistrationForm[]>([]);
  const [filteredForms, setFilteredForms] = useState<RegistrationForm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedForm, setSelectedForm] = useState<RegistrationForm | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [revealedEmails, setRevealedEmails] = useState<Set<string>>(new Set());

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

      const formsData = (data || []) as unknown as RegistrationForm[];
      setForms(formsData);
      setFilteredForms(formsData);
    } catch (error) {
      console.error('Erro ao carregar formulários:', error);
      toast.error('Erro ao carregar formulários');
    } finally {
      setIsLoading(false);
    }
  };

  const maskEmail = (email: string) => {
    const [name, domain] = email.split('@');
    const maskedName = name.substring(0, 3) + '***';
    const domainParts = domain.split('.');
    const maskedDomain = domainParts[0].substring(0, 2) + '***';
    const maskedExt = domainParts.slice(1).map(p => p.substring(0, 2) + '***').join('.');
    return `${maskedName}@${maskedDomain}.${maskedExt}`;
  };

  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const formatCep = (cep: string) => {
    return cep.replace(/(\d{5})(\d{3})/, '$1-$2');
  };

  const toggleEmailReveal = (formId: string) => {
    setRevealedEmails(prev => {
      const newSet = new Set(prev);
      if (newSet.has(formId)) {
        newSet.delete(formId);
      } else {
        newSet.add(formId);
      }
      return newSet;
    });
  };

  const handleViewForm = (form: RegistrationForm) => {
    setSelectedForm(form);
    setIsSheetOpen(true);
  };

  const handleCreateAccount = async () => {
    if (!selectedForm) return;
    
    if (!selectedForm.password) {
      toast.error('Este formulário não possui senha cadastrada');
      return;
    }

    setIsCreatingAccount(true);
    
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData.session?.access_token) {
        toast.error('Sessão expirada. Faça login novamente.');
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-user-by-admin', {
        body: {
          name: selectedForm.full_name,
          email: selectedForm.email,
          password: selectedForm.password,
          role: 'user',
          artistic_name: selectedForm.artistic_name || undefined,
          cpf: selectedForm.cpf,
          birth_date: selectedForm.birth_date,
          phone: selectedForm.phone || undefined,
          cep: selectedForm.cep,
          street: selectedForm.street,
          number: selectedForm.number,
          neighborhood: selectedForm.neighborhood,
          city: selectedForm.city,
          state: selectedForm.state,
        },
      });

      if (error) {
        console.error('Erro ao criar conta:', error);
        toast.error(error.message || 'Erro ao criar conta');
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      toast.success('Conta criada com sucesso!');
      setIsSheetOpen(false);
    } catch (error) {
      console.error('Erro ao criar conta:', error);
      toast.error('Erro ao criar conta. Tente novamente.');
    } finally {
      setIsCreatingAccount(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Sticky Header */}
      <header 
        className="sticky top-0 z-50 bg-black/95 backdrop-blur-md border-b border-white/10"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}
      >
        <div className="px-4 py-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <button onClick={onBack} className="text-white">
                <ChevronLeft className="h-6 w-6" />
              </button>
              <span className="bg-primary/20 text-primary text-xs font-bold px-3 py-1 rounded-full border border-primary/30">
                {forms.length} formulário{forms.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Formulários de Registro
          </h1>
          <p className="text-slate-400 text-base mt-1">
            Gerencie os envios de registro
          </p>
        </div>
        
        {/* Search Bar */}
        <div className="px-4 pb-4">
          <label className="relative flex items-center w-full">
            <Search className="absolute left-4 text-primary h-5 w-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-12 pl-12 pr-4 bg-[#242424] border-none rounded-xl focus:ring-2 focus:ring-primary/50 text-white placeholder:text-slate-500 transition-all"
              placeholder="Buscar por nome, e-mail ou nome artístico..."
            />
          </label>
        </div>
      </header>

      {/* Content */}
      <main className="p-4 space-y-4 pb-24">
        {filteredForms.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            {searchTerm ? 'Nenhum formulário encontrado.' : 'Nenhum formulário recebido ainda.'}
          </div>
        ) : (
          filteredForms.map((form) => (
            <div 
              key={form.id}
              className="bg-[#1A1A1A] rounded-xl p-5 border border-white/5 transition-transform active:scale-[0.98]"
            >
              <div className="mb-4">
                <h2 className="text-xl font-bold text-white mb-1">{form.full_name}</h2>
                <div className="flex items-start gap-2 text-primary/80">
                  <span className="text-sm font-medium uppercase tracking-wider shrink-0">Nome artístico:</span>
                  <span className="text-sm text-slate-300">
                    {form.artistic_name || 'Não informado'}
                  </span>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                {/* Email Row */}
                <div className="flex items-center justify-between bg-white/5 p-3 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Mail className="text-primary h-5 w-5" />
                    <span className="text-slate-300 font-mono text-sm">
                      {revealedEmails.has(form.id) ? form.email : maskEmail(form.email)}
                    </span>
                  </div>
                  <button 
                    onClick={() => toggleEmailReveal(form.id)}
                    className="text-primary hover:bg-primary/10 p-1 rounded-full transition-colors"
                  >
                    <Eye className="h-5 w-5" />
                  </button>
                </div>

                {/* Date Row */}
                <div className="flex items-center gap-3 px-3">
                  <Calendar className="text-primary h-5 w-5" />
                  <span className="text-slate-400 text-sm">
                    Enviado em {formatDateTime(form.created_at)}
                  </span>
                </div>
              </div>

              <button
                onClick={() => handleViewForm(form)}
                className="w-full bg-primary hover:bg-primary/90 text-black font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/10"
              >
                <Eye className="h-5 w-5 font-bold" />
                Visualizar
              </button>
            </div>
          ))
        )}
      </main>

      {/* Detail Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="bottom" className="h-[85vh] bg-[#0A0A0A] border-t border-white/10 rounded-t-3xl">
          <SheetHeader className="pb-4 border-b border-white/10">
            <SheetTitle className="text-white text-xl">Detalhes do Formulário</SheetTitle>
          </SheetHeader>
          
          {selectedForm && (
            <div className="overflow-y-auto h-[calc(85vh-120px)] py-4 space-y-4">
              {/* Nome Completo */}
              <div className="bg-[#1A1A1A] rounded-xl p-4 border border-white/5">
                <div className="flex items-center gap-2 text-primary mb-2">
                  <User className="h-4 w-4" />
                  <span className="text-sm font-medium">Nome Completo</span>
                </div>
                <p className="text-white">{selectedForm.full_name}</p>
              </div>

              {/* Nome Artístico */}
              <div className="bg-[#1A1A1A] rounded-xl p-4 border border-white/5">
                <div className="flex items-center gap-2 text-primary mb-2">
                  <User className="h-4 w-4" />
                  <span className="text-sm font-medium">Nome Artístico</span>
                </div>
                <p className="text-white">{selectedForm.artistic_name || 'Não informado'}</p>
              </div>

              {/* E-mail */}
              <div className="bg-[#1A1A1A] rounded-xl p-4 border border-white/5">
                <div className="flex items-center gap-2 text-primary mb-2">
                  <Mail className="h-4 w-4" />
                  <span className="text-sm font-medium">E-mail</span>
                </div>
                <DataMask data={selectedForm.email} type="email" />
              </div>

              {/* Data de Nascimento */}
              <div className="bg-[#1A1A1A] rounded-xl p-4 border border-white/5">
                <div className="flex items-center gap-2 text-primary mb-2">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm font-medium">Data de Nascimento</span>
                </div>
                <p className="text-white">{formatDate(selectedForm.birth_date)}</p>
              </div>

              {/* CPF */}
              <div className="bg-[#1A1A1A] rounded-xl p-4 border border-white/5">
                <div className="flex items-center gap-2 text-primary mb-2">
                  <span className="text-sm font-medium">CPF</span>
                </div>
                <DataMask data={selectedForm.cpf} type="cpf" />
              </div>

              {/* Telefone */}
              <div className="bg-[#1A1A1A] rounded-xl p-4 border border-white/5">
                <div className="flex items-center gap-2 text-primary mb-2">
                  <Phone className="h-4 w-4" />
                  <span className="text-sm font-medium">Telefone</span>
                </div>
                <p className="text-white">{selectedForm.phone || 'Não informado'}</p>
              </div>

              {/* Senha */}
              <div className="bg-[#1A1A1A] rounded-xl p-4 border border-white/5">
                <div className="flex items-center gap-2 text-primary mb-2">
                  <Lock className="h-4 w-4" />
                  <span className="text-sm font-medium">Senha de Acesso</span>
                </div>
                <p className="text-white font-mono bg-white/5 px-3 py-1.5 rounded-lg inline-block">
                  {selectedForm.password || 'Não informada'}
                </p>
              </div>

              {/* Endereço */}
              <div className="bg-[#1A1A1A] rounded-xl p-4 border border-white/5">
                <div className="flex items-center gap-2 text-primary mb-2">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm font-medium">Endereço</span>
                </div>
                <div className="text-white space-y-1">
                  <p>{selectedForm.street}, {selectedForm.number}</p>
                  <p>{selectedForm.neighborhood}</p>
                  <p>{selectedForm.city} - {selectedForm.state}</p>
                  <p className="text-slate-400">CEP: {formatCep(selectedForm.cep)}</p>
                </div>
              </div>

              {/* Data de Envio */}
              <div className="text-center text-xs text-slate-500 py-2">
                Formulário enviado em {formatDateTime(selectedForm.created_at)}
              </div>

              {/* Criar Conta Button */}
              <Button
                onClick={handleCreateAccount}
                disabled={isCreatingAccount || !selectedForm.password}
                className="w-full bg-primary hover:bg-primary/90 text-black font-bold py-4 rounded-xl"
              >
                {isCreatingAccount ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Criando...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-5 w-5 mr-2" />
                    Criar Conta
                  </>
                )}
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};
