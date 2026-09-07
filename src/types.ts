export interface TemplateServices {
  auth: boolean;
  data: boolean;
  storage: boolean;
  staticHosting: boolean;
}

export interface GalleryTemplate {
  id: string;
  displayName: string;
  description: string;
  path: string;
  sourceUrl: string;
  scaffoldCommand: string;
  stacks: string[];
  capabilities: string[];
  services: TemplateServices;
  experimental: boolean;
  previewImage: string | null;
}

export interface GalleryFilters {
  query: string;
  capability: string;
  stack: string;
}
