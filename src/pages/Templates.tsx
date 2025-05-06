
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useTemplates } from '@/hooks/useTemplates';
import TemplateCard from '@/components/templates/TemplateCard';
import TemplateFormDialog from '@/components/templates/TemplateFormDialog';

const Templates: React.FC = () => {
  const {
    templates,
    isNewTemplateOpen,
    setIsNewTemplateOpen,
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
    openNewTemplateDialog,
    openEditTemplateDialog,
    handleSaveTemplate,
    handleDeleteTemplate,
    setActiveTemplate
  } = useTemplates();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Modelos de DA</h2>
        <Button onClick={openNewTemplateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Modelo
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {templates.map(template => (
          <TemplateCard
            key={template.id}
            template={template}
            onEdit={openEditTemplateDialog}
            onDelete={handleDeleteTemplate}
            onUse={setActiveTemplate}
          />
        ))}
      </div>
      
      <TemplateFormDialog
        isOpen={isNewTemplateOpen}
        onOpenChange={setIsNewTemplateOpen}
        editingTemplate={editingTemplate}
        name={name}
        setName={setName}
        location={location}
        setLocation={setLocation}
        city={city}
        setCity={setCity}
        notes={notes}
        setNotes={setNotes}
        genre={genre}
        setGenre={setGenre}
        version={version}
        setVersion={setVersion}
        collaborators={collaborators}
        setCollaborators={setCollaborators}
        instrumentation={instrumentation}
        setInstrumentation={setInstrumentation}
        duration={duration}
        setDuration={setDuration}
        selectedFields={selectedFields}
        setSelectedFields={setSelectedFields}
        onSave={handleSaveTemplate}
      />
    </div>
  );
};

export default Templates;
