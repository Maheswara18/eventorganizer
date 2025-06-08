export interface Event {
  id: number;
  admin_id: number;
  image_path: string;
  title: string;
  description: string;
  provides_certificate: number;
  price: string;
  location: string;
  status: string;
  max_participants: number;
  start_datetime: string;
  end_datetime: string;
  created_at: string;
  updated_at: string;
  admin?: {
    id: number;
    name: string;
    email: string;
    role: string;
    created_at: string;
    updated_at: string;
  };
}

export interface EventResponse {
  success: boolean;
  message?: string;
  event?: Event;
  events?: Event[];
  count?: number;
  registered?: boolean;
  template?: any;
}

export interface EventData extends Event {
  registered_participants: number;
}

export interface RegisteredEvent {
  id: number;
  title: string;
  description: string;
  location: string;
  price: string;
  start_datetime: string;
  end_datetime: string;
  image_path: string;
  payment_status: string;
  registration_date: string;
  max_participants: number;
  registered_participants: number;
} 