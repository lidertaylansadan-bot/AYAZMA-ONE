// Shared types between frontend and backend

export interface Profile {
  id: string;
  full_name: string | null;
  created_at: string;
}

export interface Project {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  sector: string;
  project_type: 'saas' | 'web_app' | 'mobile_app' | 'media' | 'hybrid';
  status: 'draft' | 'building' | 'live' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface SectorBlueprint {
  id: string;
  sector_code: string;
  name: string;
  short_description: string;
  default_data_schema: any;
  default_workflows: any;
  default_ui_layout: any;
  created_at: string;
}

export interface AppWizardSession {
  id: string;
  project_id: string;
  user_id: string;
  answers: any;
  created_at: string;
}

export interface WorkflowWizardSession {
  id: string;
  project_id: string;
  user_id: string;
  answers: any;
  created_at: string;
}

export interface ContentWizardSession {
  id: string;
  project_id: string;
  user_id: string;
  answers: any;
  created_at: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}