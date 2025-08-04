import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { moderatorTransactionService } from '@/services/moderatorTransactionService';

interface TransactionFormProps {
  userId: string;
  userName: string;
  onTransactionCreated?: () => void;
}

export const TransactionForm = ({ userId, userName, onTransactionCreated }: TransactionFormProps) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || !description) {
      toast({
        title: 'Erro',
        description: 'Todos os campos são obrigatórios',
        variant: 'destructive'
      });
      return;
    }

    const numericAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(numericAmount) || numericAmount <= 0) {
      toast({
        title: 'Erro',
        description: 'O valor deve ser um número positivo',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      await moderatorTransactionService.createTransaction(userId, numericAmount, description);
      
      toast({
        title: 'Sucesso',
        description: 'Transação criada com sucesso',
      });

      // Limpar formulário
      setAmount('');
      setDescription('');
      
      // Notificar componente pai
      onTransactionCreated?.();
    } catch (error) {
      console.error('Erro ao criar transação:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao criar transação',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: string) => {
    // Remove caracteres não numéricos
    const numericValue = value.replace(/[^\d,]/g, '');
    return numericValue;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <DollarSign className="h-5 w-5" />
          <span>Lançar Valor para {userName}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="amount">Valor (R$)</Label>
            <Input
              id="amount"
              type="text"
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(formatCurrency(e.target.value))}
              className="text-right"
            />
          </div>
          
          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Descreva o motivo deste lançamento..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            {isLoading ? 'Criando...' : 'Criar Lançamento'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};