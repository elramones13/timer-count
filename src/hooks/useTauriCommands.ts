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
        estimatedHours?: number | null;
        hoursPerDay?: number | null;
        hoursPerWeek?: number | null;
        deadline?: string | null;
      }) => {
        return invoke<Project>('create_project', {
          name: data.name,
          description: data.description || null,
          clientId: data.clientId || null,
          color: data.color || null,
          priority: data.priority,
          status: data.status,
          estimatedHours: data.estimatedHours ?? null,
          hoursPerDay: data.hoursPerDay ?? null,
          hoursPerWeek: data.hoursPerWeek ?? null,
          deadline: data.deadline || null,
        });
      },
      update: (data: {
        id: string;
        name: string;
        description?: string;
        clientId?: string;
        color?: string;
        priority: number;
        status: string;
        estimatedHours?: number | null;
        hoursPerDay?: number | null;
        hoursPerWeek?: number | null;
        deadline?: string | null;
      }) => {
        return invoke<Project>('update_project', {
          id: data.id,
          name: data.name,
          description: data.description || null,
          clientId: data.clientId || null,
          color: data.color || null,
          priority: data.priority,
          status: data.status,
          estimatedHours: data.estimatedHours ?? null,
          hoursPerDay: data.hoursPerDay ?? null,
          hoursPerWeek: data.hoursPerWeek ?? null,
          deadline: data.deadline || null,
        });
      },
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
      update: (data: {
        sessionId: string;
        projectId: string;
        startTime: string;
        endTime: string;
        notes?: string;
      }) =>
        invoke<TimeSession>('update_session', {
          sessionId: data.sessionId,
          projectId: data.projectId,
          startTime: data.startTime,
          endTime: data.endTime,
          notes: data.notes,
        }),
      stopAllRunning: () => invoke<TimeSession[]>('stop_all_running_sessions'),
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
