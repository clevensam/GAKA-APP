
export type ResourceType = 'Notes' | 'Past Paper';

export interface AcademicFile {
  id: string;
  name: string;
  type: ResourceType;
  driveUrl: string;
  size?: string;
}

export interface Module {
  id: string;
  code: string;
  name: string;
  description: string;
  resources: AcademicFile[];
}

export interface SearchFilters {
  query: string;
  type: ResourceType | 'All';
}
