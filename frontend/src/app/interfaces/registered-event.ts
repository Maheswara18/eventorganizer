export interface RegisteredEvent {
  id: number;
  title: string;
  description: string;
  start_datetime: string;
  end_datetime: string;
  location: string;
  price: number;
  capacity: number;
  image_path?: string;
  payment_status: string;
  registration_date: string;
} 