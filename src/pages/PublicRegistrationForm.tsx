import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  artisticName: z.string().optional(),
  email: z.string().email('E-mail inválido'),
  fullName: z.string().min(1, 'Nome completo é obrigatório'),
  cpf: z.string().min(11, 'CPF deve ter pelo menos 11 dígitos'),
  birthDate: z.string().min(1, 'Data de nascimento é obrigatória'),
  cep: z.string().min(8, 'CEP deve ter 8 dígitos'),
  street: z.string().min(1, 'Rua é obrigatória'),
  number: z.string().min(1, 'Número é obrigatório'),
  neighborhood: z.string().min(1, 'Bairro é obrigatório'),
  city: z.string().min(1, 'Cidade é obrigatória'),
  state: z.string().min(1, 'Estado é obrigatório'),
  phone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos'),
});

export default function PublicRegistrationForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      artisticName: '',
      email: '',
      fullName: '',
      cpf: '',
      birthDate: '',
      cep: '',
      street: '',
      number: '',
      neighborhood: '',
      city: '',
      state: '',
      phone: '',
    },
  });

  const fetchAddressByCep = async (cep: string) => {
    if (cep.length !== 8) return;
    
    setIsLoadingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();
      
      if (!data.erro) {
        form.setValue('street', data.logradouro || '');
        form.setValue('neighborhood', data.bairro || '');
        form.setValue('city', data.localidade || '');
        form.setValue('state', data.uf || '');
      } else {
        toast.error('CEP não encontrado');
      }
    } catch (error) {
      toast.error('Erro ao buscar CEP');
    } finally {
      setIsLoadingCep(false);
    }
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cep = e.target.value.replace(/\D/g, '');
    form.setValue('cep', cep);
    
    if (cep.length === 8) {
      fetchAddressByCep(cep);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      // Use the secure registration function instead of direct table insert
      const { data, error } = await supabase.rpc('secure_public_registration', {
        p_email: values.email,
        p_full_name: values.fullName,
        p_cpf: values.cpf,
        p_birth_date: values.birthDate,
        p_cep: values.cep,
        p_street: values.street,
        p_number: values.number,
        p_neighborhood: values.neighborhood,
        p_city: values.city,
        p_state: values.state,
        p_phone: values.phone,
        p_artistic_name: values.artisticName || null,
        // p_client_ip would require server-side implementation for security
      });

      if (error) throw error;

      // Check the response from the secure function
      const result = data as { success: boolean; error?: string; registration_id?: string; message?: string };
      if (result && result.success === false) {
        toast.error(result.error || 'Erro ao enviar formulário');
        return;
      }

      toast.success('Formulário enviado com sucesso!');
      setIsSubmitted(true);
      form.reset();
    } catch (error: any) {
      console.error('Erro ao enviar formulário:', error);
      
      // Handle specific error messages from the secure function
      if (error.message?.includes('already registered')) {
        toast.error('Este email ou CPF já foi registrado anteriormente.');
      } else if (error.message?.includes('Too many')) {
        toast.error('Muitas tentativas de registro. Tente novamente mais tarde.');
      } else {
        toast.error('Erro ao enviar formulário. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <img 
              src="/lovable-uploads/ba70bb76-0b14-48f2-a7e9-9a6e16e651f7.png"
              alt="Compuse Logo" 
              className="h-16"
            />
          </div>
          <div className="space-y-4">
            <h1 className="text-3xl font-bold text-foreground">
              Obrigado pelo seu interesse!
            </h1>
            <p className="text-lg text-muted-foreground max-w-md mx-auto">
              Recebemos suas informações com sucesso. Em breve, alguém da equipe Compuse entrará em contato para a conclusão do seu registro.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img 
              src="/lovable-uploads/ba70bb76-0b14-48f2-a7e9-9a6e16e651f7.png"
              alt="Compuse Logo" 
              className="h-12"
            />
          </div>
          <CardTitle className="text-2xl">Formulário de Registro</CardTitle>
          <CardDescription>
            Preencha seus dados para o registro na plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="artisticName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Artístico (Opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Digite seu nome artístico" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mail *</FormLabel>
                      <FormControl>
                        <Input placeholder="seu@email.com" type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Completo *</FormLabel>
                      <FormControl>
                        <Input placeholder="Digite seu nome completo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="cpf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPF *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="000.000.000-00" 
                          {...field} 
                          onChange={(e) => {
                            const cpf = e.target.value.replace(/\D/g, '');
                            field.onChange(cpf);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="birthDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Nascimento *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="(11) 99999-9999" 
                        type="tel"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Endereço</h3>
                
                <FormField
                  control={form.control}
                  name="cep"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CEP *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            placeholder="00000-000" 
                            value={field.value}
                            onChange={handleCepChange}
                          />
                          {isLoadingCep && (
                            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin" />
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="street"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Rua *</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome da rua" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número *</FormLabel>
                        <FormControl>
                          <Input placeholder="123" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="neighborhood"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bairro *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do bairro" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cidade *</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome da cidade" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado *</FormLabel>
                        <FormControl>
                          <Input placeholder="SP" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading || !form.formState.isValid}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Enviar Dados para Registro'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}