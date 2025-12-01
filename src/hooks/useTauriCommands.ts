import { invoke } from '@tauri-apps/api/core';
import type { Client, Project, TimeSession, ProjectStats, DailyStats, ProjectTimeBreakdown } from '../types';

export const useTauriCommands = () => {
  return {
    clients: {
      getAll: () => invoke<Client[]>('get_all_clients'),
      get: (id: string) => invoke<Client>('get_client', { id }),
      create: (data: { name: string; description?: string; color?: string }) =>
        invoke<Client>('create_client', data),
      update: (data: { id: string; name: string; description?: string; color?: string }) =>
        invoke<Client>('update_client', data),
      delete: (id: string) => invoke<void>('delete_client', { id }),
    },

    projects: {
      getAll: () => invoke<Project[]>('get_all_projects'),
      get: (id: string) => invoke<Project>('get_project', { id }),
      create: (data: {
        name: string;
        description?: string;
        clientId?: string;
        color?: string;
        priority: number;
        status: string;
        estimatedHours?: number;
        hoursPerDay?: number;
        hoursPerWeek?: number;
        deadline?: string;
      }) =>
        invoke<Project>('create_project', {
          name: data.name,
          description: data.description,
          client_id: data.clientId,
          color: data.color,
          priority: data.priority,
          status: data.status,
          estimated_hours: data.estimatedHours,
          hours_per_day: data.hoursPerDay,
          hours_per_week: data.hoursPerWeek,
          deadline: data.deadline,
        }),
      update: (data: {
        id: string;
        name: string;
        description?: string;
        clientId?: string;
        color?: string;
        priority: number;
        status: string;
        estimatedHours?: number;
        hoursPerDay?: number;
        hoursPerWeek?: number;
        deadline?: string;
      }) =>
        invoke<Project>('update_project', {
          id: data.id,
          name: data.name,
          description: data.description,
          client_id: data.clientId,
          color: data.color,
          priority: data.priority,
          status: data.status,
          estimated_hours: data.estimatedHours,
          hours_per_day: data.hoursPerDay,
          hours_per_week: data.hoursPerWeek,
          deadline: data.deadline,
        }),
      delete: (id: string) => invoke<void>('delete_project', { id }),
    },

    sessions: {
      getAll: () => invoke<TimeSession[]>('get_all_sessions'),
      getRunning: () => invoke<TimeSession[]>('get_running_sessions'),
      getByProject: (projectId: string) =>
        invoke<TimeSession[]>('get_project_sessions', { projectId }),
      start: (projectId: string) => invoke<TimeSession>('start_session', { projectId }),
      stop: (sessionId: string, notes?: string) =>
        invoke<TimeSession>('stop_session', { sessionId, notes }),
      updateNotes: (sessionId: string, notes?: string) =>
        invoke<TimeSession>('update_session_notes', { sessionId, notes }),
      delete: (sessionId: string) => invoke<void>('delete_session', { sessionId }),
    },

    stats: {
      getProjectStats: (projectId: string) =>
        invoke<ProjectStats>('get_project_stats', { projectId }),
      getAllProjectsStats: () => invoke<ProjectStats[]>('get_all_projects_stats'),
      getDailyStats: (startDate: string, endDate: string) =>
        invoke<DailyStats[]>('get_daily_stats', { startDate, endDate }),
      getDateRangeStats: (startDate: string, endDate: string) =>
        invoke<ProjectTimeBreakdown[]>('get_date_range_stats', { startDate, endDate }),
    },

    tray: {
      updateMenu: (projects: Project[], runningSessions: TimeSession[]) =>
        invoke<void>('update_tray_menu', { projects, runningSessions }),
    },

    export: {
      dailyBackup: (date: string) =>
        invoke<string>('export_daily_backup', { date }),
      saveDailyBackup: (date: string, filePath: string) =>
        invoke<void>('save_daily_backup', { date, filePath }),
      generatePdfReport: (startDate: string, endDate: string, filePath: string) =>
        invoke<void>('generate_pdf_report', { startDate, endDate, filePath }),
      getCurrentMonthRange: () =>
        invoke<[string, string]>('get_current_month_range'),
    },
  };
};
