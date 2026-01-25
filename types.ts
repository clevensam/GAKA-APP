
export type ResourceType = 'Notes' | 'Past Paper';
export type UserRole = 'admin' | 'student';

export interface Profile {
  id: string;
  username: string;
  full_name: string;
  role: UserRole;
}

export interface AcademicFile {
  id: string;
  title: string;
  type: ResourceType;
  downloadUrl: string;
  viewUrl: string;
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
