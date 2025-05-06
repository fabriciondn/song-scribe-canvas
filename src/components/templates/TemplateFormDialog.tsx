
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Template, TemplateField } from '@/types/template';

interface TemplateFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingTemplate: Template | null;
  name: string;
  setName: (name: string) => void;
  location: string;
  setLocation: (location: string) => void;
  city: string;
  setCity: (city: string) => void;
  notes: string;
  setNotes: (notes: string) => void;
  genre: string;
  setGenre: (genre: string) => void;
  version: string;
  setVersion: (version: string) => void;
  collaborators: string;
  setCollaborators: (collaborators: string) => void;
  instrumentation: string;
  setInstrumentation: (instrumentation: string) => void;
  duration: string;
  setDuration: (duration: string) => void;
  selectedFields: TemplateField[];
  setSelectedFields: (fields: TemplateField[]) => void;
  onSave: () => void;
}

type FieldOption = {
  id: TemplateField;
  label: string;
}

const fieldOptions: FieldOption[] = [
  { id: "location", label: "Local" },
  { id: "city", label: "Cidade" },
  { id: "notes", label: "Observações" },
  { id: "genre", label: "Gênero Musical" },
  { id: "version", label: "Versão da Letra" },
  { id: "collaborators", label: "Colaboradores" },
  { id: "instrumentation", label: "Instrumentação Prevista" },
  { id: "duration", label: "Duração Estimada" },
];

const TemplateFormDialog: React.FC<TemplateFormDialogProps> = ({
  isOpen,
  onOpenChange,
  editingTemplate,
  name,
  setName,
  location,
  setLocation,
  city,
  setCity,
  notes,
  setNotes,
  genre,
  setGenre,
  version,
  setVersion,
  collaborators,
  setCollaborators,
  instrumentation,
  setInstrumentation,
  duration,
  setDuration,
  selectedFields,
  setSelectedFields,
  onSave
}) => {
  // Toggle field selection
  const toggleField = (field: TemplateField) => {
    setSelectedFields(
      selectedFields.includes(field)
        ? selectedFields.filter(f => f !== field)
        : [...selectedFields, field]
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingTemplate ? 'Editar Modelo' : 'Novo Modelo de DA'}
          </DialogTitle>
          <DialogDescription>
            {editingTemplate 
              ? 'Edite as informações do modelo de documento de anterioridade.' 
              : 'Crie um novo modelo para seus documentos de anterioridade.'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="grid gap-2">
            <Label htmlFor="name">Nome do Modelo <span className="text-destructive">*</span></Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Modelo Padrão"
            />
          </div>
          
          <div className="border-t pt-4 mt-2">
            <Label className="block mb-3 font-medium">Campos a incluir no modelo:</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {fieldOptions.map((option) => (
                <div key={option.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`field-${option.id}`} 
                    checked={selectedFields.includes(option.id)}
                    onCheckedChange={() => toggleField(option.id)}
                  />
                  <Label htmlFor={`field-${option.id}`} className="cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          
          {selectedFields.includes("location") && (
            <div className="grid gap-2">
              <Label htmlFor="location">Local</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ex: Estúdio, Residência"
              />
            </div>
          )}
          
          {selectedFields.includes("city") && (
            <div className="grid gap-2">
              <Label htmlFor="city">Cidade</Label>
              <Input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ex: São Paulo"
              />
            </div>
          )}
          
          {selectedFields.includes("genre") && (
            <div className="grid gap-2">
              <Label htmlFor="genre">Gênero Musical</Label>
              <Select value={genre} onValueChange={setGenre}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um gênero" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pop">Pop</SelectItem>
                  <SelectItem value="Sertanejo">Sertanejo</SelectItem>
                  <SelectItem value="Rap">Rap</SelectItem>
                  <SelectItem value="Gospel">Gospel</SelectItem>
                  <SelectItem value="MPB">MPB</SelectItem>
                  <SelectItem value="Rock">Rock</SelectItem>
                  <SelectItem value="Outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          
          {selectedFields.includes("version") && (
            <div className="grid gap-2">
              <Label htmlFor="version">Versão da Letra</Label>
              <Select value={version} onValueChange={setVersion}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma versão" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="V1">V1</SelectItem>
                  <SelectItem value="V2">V2</SelectItem>
                  <SelectItem value="Demo">Demo</SelectItem>
                  <SelectItem value="Final">Final</SelectItem>
                  <SelectItem value="Ao Vivo">Ao Vivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          
          {selectedFields.includes("collaborators") && (
            <div className="grid gap-2">
              <Label htmlFor="collaborators">Colaboradores</Label>
              <Input
                id="collaborators"
                value={collaborators}
                onChange={(e) => setCollaborators(e.target.value)}
                placeholder="Ex: João Silva, Maria Souza"
              />
            </div>
          )}
          
          {selectedFields.includes("instrumentation") && (
            <div className="grid gap-2">
              <Label htmlFor="instrumentation">Instrumentação Prevista</Label>
              <Input
                id="instrumentation"
                value={instrumentation}
                onChange={(e) => setInstrumentation(e.target.value)}
                placeholder="Ex: Piano e Voz"
              />
            </div>
          )}
          
          {selectedFields.includes("duration") && (
            <div className="grid gap-2">
              <Label htmlFor="duration">Duração Estimada da Música</Label>
              <Input
                id="duration"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="Ex: 3:30min"
              />
            </div>
          )}
          
          {selectedFields.includes("notes") && (
            <div className="grid gap-2">
              <Label htmlFor="notes">Observações</Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observações adicionais..."
              />
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="grid gap-2">
              <Label>Data</Label>
              <Input value={new Date().toLocaleDateString('pt-BR')} readOnly className="bg-muted" />
            </div>
            
            <div className="grid gap-2">
              <Label>Hora</Label>
              <Input 
                value={new Date().toLocaleTimeString('pt-BR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })} 
                readOnly 
                className="bg-muted" 
              />
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onSave}>
            {editingTemplate ? 'Salvar Alterações' : 'Criar Modelo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TemplateFormDialog;
