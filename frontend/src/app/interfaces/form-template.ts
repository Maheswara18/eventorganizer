export interface FormField {
  id?: number;
  form_template_id?: number;
  label: string;
  type: string;
  options?: string[];
  is_required: boolean;
  order: number;
  created_at?: string;
  updated_at?: string;
}

export interface FormTemplate {
  id?: number;
  event_id: number;
  name: string;
  description?: string;
  is_active?: boolean;
  fields: FormField[];
  created_at?: string;
  updated_at?: string;
}

// Response dari API langsung mengembalikan FormTemplate
export type FormTemplateResponse = FormTemplate; 