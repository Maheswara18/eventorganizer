export interface Event {
  id: number;
  admin_id: number;
  image_path: string;
  title: string;
  description: string;
  provides_certificate: number;
  price: number;
  location: string;
  status: string;
  max_participants: number;
  registered_participants?: number;
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
  start_datetime: string;
  end_datetime: string;
  image_path?: string;
  max_participants: number;
  registered_participants: number;
  payment_status: 'belum_bayar' | 'pending' | 'completed' | 'failed';
  payment_date?: string;
  registration_date: string;
} 