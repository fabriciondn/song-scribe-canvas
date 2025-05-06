
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
import { FileText, Trash2, Edit, Check } from 'lucide-react';
import { Template } from '@/types/template';

interface TemplateCardProps {
  template: Template;
  onEdit: (template: Template) => void;
  onDelete: (id: string) => void;
  onUse: (id: string) => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({ 
  template, 
  onEdit, 
  onDelete,
  onUse
}) => {
  return (
    <Card className={`${template.isActive ? 'border-primary border-2' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            <FileText className="h-5 w-5 text-primary mr-2" />
            <div>
              <CardTitle className="flex items-center">
                {template.name}
                {template.isActive && (
                  <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full flex items-center">
                    <Check className="h-3 w-3 mr-1" />
                    Ativo
                  </span>
                )}
              </CardTitle>
            </div>
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
          {template.location && (
            <div className="flex items-start">
              <span className="font-medium min-w-[80px]">Local:</span>
              <span>{template.location}</span>
            </div>
          )}
          {template.city && (
            <div className="flex items-start">
              <span className="font-medium min-w-[80px]">Cidade:</span>
              <span>{template.city}</span>
            </div>
          )}
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
        
        <div className="mt-4 text-xs text-muted-foreground">
          <p>Campos incluídos: {template.selectedFields?.length || 0}</p>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          variant={template.isActive ? "secondary" : "outline"} 
          className="w-full"
          onClick={() => onUse(template.id)}
          disabled={template.isActive}
        >
          {template.isActive ? 'Modelo em Uso' : 'Usar este modelo'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default TemplateCard;
