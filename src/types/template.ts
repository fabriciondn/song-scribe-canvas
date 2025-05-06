
export interface Template {
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
  isActive?: boolean;
  selectedFields?: TemplateField[];
}

export type TemplateField = 
  | "name"
  | "location"
  | "city"
  | "notes"
  | "genre"
  | "version"
  | "collaborators"
  | "instrumentation"
  | "duration";

export const DEFAULT_TEMPLATE_FIELDS: TemplateField[] = [
  "name",
  "location",
  "city"
];
