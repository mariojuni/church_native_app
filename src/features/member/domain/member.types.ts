export interface Member {
  id: string;
  name?: string;
  avatar?: string;
  role?: string;
  status?: string;
  [key: string]: any;
}

export interface Service {
  id: string;
  date?: string;
  [key: string]: any;
}
