
import { useState } from 'react';
import { TemplateField, DEFAULT_TEMPLATE_FIELDS } from '@/types/template';

export const useTemplateState = () => {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [city, setCity] = useState('');
  const [notes, setNotes] = useState('');
  const [genre, setGenre] = useState('');
  const [version, setVersion] = useState('');
  const [collaborators, setCollaborators] = useState('');
  const [instrumentation, setInstrumentation] = useState('');
  const [duration, setDuration] = useState('');
  const [selectedFields, setSelectedFields] = useState<TemplateField[]>(DEFAULT_TEMPLATE_FIELDS);
  
  // Reset all form fields to their default values
  const resetFields = () => {
    setName('');
    setLocation('');
    setCity('');
    setNotes('');
    setGenre('');
    setVersion('');
    setCollaborators('');
    setInstrumentation('');
    setDuration('');
    setSelectedFields(DEFAULT_TEMPLATE_FIELDS);
  };
  
  // Initialize fields with template data
  const initializeWithTemplate = (template: {
    name: string;
    location?: string;
    city?: string;
    notes?: string;
    genre?: string;
    version?: string;
    collaborators?: string;
    instrumentation?: string;
    duration?: string;
    selectedFields?: TemplateField[];
  }) => {
    setName(template.name || '');
    setLocation(template.location || '');
    setCity(template.city || '');
    setNotes(template.notes || '');
    setGenre(template.genre || '');
    setVersion(template.version || '');
    setCollaborators(template.collaborators || '');
    setInstrumentation(template.instrumentation || '');
    setDuration(template.duration || '');
    setSelectedFields(template.selectedFields || DEFAULT_TEMPLATE_FIELDS);
  };
  
  return {
    name, setName,
    location, setLocation,
    city, setCity,
    notes, setNotes,
    genre, setGenre,
    version, setVersion,
    collaborators, setCollaborators,
    instrumentation, setInstrumentation,
    duration, setDuration,
    selectedFields, setSelectedFields,
    resetFields,
    initializeWithTemplate
  };
};
