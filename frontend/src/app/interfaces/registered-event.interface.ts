import { EventData } from './event.interface';
 
export interface RegisteredEvent extends EventData {
  capacity: number;
  payment_status: string;
  registration_date: string;
} 