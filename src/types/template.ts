
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
}
