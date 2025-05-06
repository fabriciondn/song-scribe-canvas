
import React from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Trash2, Edit } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  location: string;
  city: string;
  notes: string;
  genre?: string;
  version?: string;
  collaborators?: string;
  instrumentation?: string;
  duration?: string;
  createdAt: string;
  createdTime: string;
}

interface TemplateCardProps {
  template: Template;
  onEdit: (template: Template) => void;
  onDelete: (id: string) => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({ template, onEdit, onDelete }) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            <FileText className="h-5 w-5 text-primary mr-2" />
            <CardTitle>{template.name}</CardTitle>
          </div>
          <div className="flex space-x-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => onEdit(template)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => onDelete(template.id)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
        <CardDescription>Modelo para documento de anterioridade</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex items-start">
            <span className="font-medium min-w-[80px]">Local:</span>
            <span>{template.location}</span>
          </div>
          <div className="flex items-start">
            <span className="font-medium min-w-[80px]">Cidade:</span>
            <span>{template.city}</span>
          </div>
          {template.genre && (
            <div className="flex items-start">
              <span className="font-medium min-w-[80px]">Gênero:</span>
              <span>{template.genre}</span>
            </div>
          )}
          {template.version && (
            <div className="flex items-start">
              <span className="font-medium min-w-[80px]">Versão:</span>
              <span>{template.version}</span>
            </div>
          )}
          {template.notes && (
            <div className="flex items-start">
              <span className="font-medium min-w-[80px]">Notas:</span>
              <span className="text-muted-foreground">{template.notes}</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full">
          Usar este modelo
        </Button>
      </CardFooter>
    </Card>
  );
};

export default TemplateCard;
