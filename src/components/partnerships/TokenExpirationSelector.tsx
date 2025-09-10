import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface TokenExpirationSelectorProps {
  value: number;
  onChange: (hours: number) => void;
}

const expirationOptions = [
  { value: 1, label: '1 hora' },
  { value: 6, label: '6 horas' },
  { value: 12, label: '12 horas' },
  { value: 24, label: '1 dia' },
  { value: 48, label: '2 dias' },
  { value: 72, label: '3 dias' },
  { value: 168, label: '1 semana' },
  { value: 336, label: '2 semanas' },
  { value: 720, label: '30 dias' }
];

export const TokenExpirationSelector: React.FC<TokenExpirationSelectorProps> = ({ value, onChange }) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="expiration-selector">Validade do token</Label>
      <Select value={value.toString()} onValueChange={(val) => onChange(Number(val))}>
        <SelectTrigger>
          <SelectValue placeholder="Selecione a validade" />
        </SelectTrigger>
        <SelectContent>
          {expirationOptions.map((option) => (
            <SelectItem key={option.value} value={option.value.toString()}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};