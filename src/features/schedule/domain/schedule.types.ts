export interface Duty {
  role: string;
  userId: string;
  status: string;
}

export interface Rsvp {
  userId: string;
  status: 'going' | 'maybe' | 'not_going';
}

export interface Schedule {
  id: string;
  event: string;
  date: string;
  time: string;
  endTime?: string;
  location: string;
  duties: Duty[];
  rsvps: Rsvp[];
  createdAt?: unknown;
}

