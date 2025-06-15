export interface Participant {
    id: number;
    user_id: number;
    event_id: number;
    name: string;
    email: string;
    phone: string;
    status: ParticipantStatus;
    attendance_status: 'present' | 'absent' | 'late' | 'registered';
    payment_status: 'belum_bayar' | 'pending' | 'completed' | 'failed' | 'paid';
    notes?: string;
    created_at: string;
    updated_at: string;
    event?: {
        title: string;
        start_date: string;
        end_date: string;
    };
    user?: {
        name: string;
        email: string;
    };
}

export type ParticipantStatus = 'pending' | 'approved' | 'rejected';


export interface PaginatedParticipants {
  data: Participant[];
  current_page: number;
  last_page: number;
  total: number;
}