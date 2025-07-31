import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Edit, 
  Users, 
  Shield, 
  Folder, 
  FileText
} from 'lucide-react';

interface CardSelectorProps {
  expandedSections: string[];
  onToggleSection: (section: string) => void;
  children: React.ReactNode;
}

const cardOptions = [
  { id: 'compositions', name: 'Composições', icon: Edit, color: 'text-blue-600' },
  { id: 'partnerships', name: 'Parcerias', icon: Users, color: 'text-purple-600' },
  { id: 'registeredWorks', name: 'Obras Registradas', icon: Shield, color: 'text-green-600' },
  { id: 'folders', name: 'Pastas', icon: Folder, color: 'text-yellow-600' },
  { id: 'templates', name: 'Modelos de DA', icon: FileText, color: 'text-indigo-600' },
];

export const CardSelector: React.FC<CardSelectorProps> = ({ 
  expandedSections, 
  onToggleSection, 
  children 
}) => {
  const handleSelectAll = () => {
    if (expandedSections.includes('all')) {
      onToggleSection('all');
    } else {
      onToggleSection('all');
    }
  };

  const isAllSelected = expandedSections.includes('all');

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Selecionar Cards do Dashboard</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="select-all"
              checked={isAllSelected}
              onCheckedChange={handleSelectAll}
            />
            <label htmlFor="select-all" className="text-sm font-medium">
              {isAllSelected ? 'Recolher Tudo' : 'Expandir Tudo'}
            </label>
          </div>
          
          <div className="border-t pt-4">
            <p className="text-sm text-muted-foreground mb-3">
              Ou selecione cards individuais:
            </p>
            <div className="grid grid-cols-1 gap-2">
              {cardOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = expandedSections.includes(option.id);
                
                return (
                  <Card 
                    key={option.id} 
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-muted border-primary' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => onToggleSection(option.id)}
                  >
                    <CardContent className="flex items-center space-x-3 p-3">
                      <Checkbox
                        checked={isSelected}
                        onChange={() => {}}
                        className="pointer-events-none"
                      />
                      <Icon className={`h-4 w-4 ${option.color}`} />
                      <span className="text-sm font-medium">{option.name}</span>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};