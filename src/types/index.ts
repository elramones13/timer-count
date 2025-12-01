export interface Client {
  id: string;
  name: string;
  description?: string;
  color?: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  client_id?: string;
  color?: string;
  priority: number; // 1 = low, 2 = medium, 3 = high, 4 = urgent
  status: 'active' | 'paused' | 'completed' | 'archived';
  estimated_hours?: number;
  hours_per_day?: number;
  hours_per_week?: number;
  deadline?: string;
  created_at: string;
  updated_at: string;
}

export interface TimeSession {
  id: string;
  project_id: string;
  start_time: string;
  end_time?: string;
  duration_seconds?: number;
  notes?: string;
  is_running: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProjectStats {
  project_id: string;
  total_seconds: number;
  total_hours: number;
  session_count: number;
}

export interface DailyStats {
  date: string;
  total_seconds: number;
  total_hours: number;
  project_breakdown: ProjectTimeBreakdown[];
}

export interface ProjectTimeBreakdown {
  project_id: string;
  project_name: string;
  client_name?: string;
  total_seconds: number;
  total_hours: number;
}

export const PRIORITY_LABELS: Record<number, string> = {
  1: 'Low',
  2: 'Medium',
  3: 'High',
  4: 'Urgent',
};

export const STATUS_LABELS: Record<Project['status'], string> = {
  active: 'Active',
  paused: 'Paused',
  completed: 'Completed',
  archived: 'Archived',
};
