export interface FormField {
  id?: number;
  label: string;
  type: string;
  options?: string[];
  is_required: boolean;
  order: number;
}

export interface FormTemplate {
  id?: number;
  event_id: number;
  name: string;
  description?: string;
  fields: FormField[];
}

export interface FormTemplateResponse {
  template: FormTemplate;
  message?: string;
} 