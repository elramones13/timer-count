import { create } from 'zustand';
import type { Client, Project, TimeSession, ProjectStats } from '../types';

interface AppState {
  // Data
  clients: Client[];
  projects: Project[];
  sessions: TimeSession[];
  runningSessions: TimeSession[];
  projectStats: Map<string, ProjectStats>;

  // UI State
  selectedProjectId?: string;
  selectedDate: Date;

  // Timer State
  timerProjectId: string;
  timerMinutes: number;
  timerTimeLeft: number;
  timerIsRunning: boolean;
  timerInitialTime: number;
  timerSessionId: string | null;
  timerStartTime: string | null;

  // Setters
  setClients: (clients: Client[]) => void;
  addClient: (client: Client) => void;
  updateClient: (client: Client) => void;
  removeClient: (id: string) => void;

  setProjects: (projects: Project[]) => void;
  addProject: (project: Project) => void;
  updateProject: (project: Project) => void;
  removeProject: (id: string) => void;

  setSessions: (sessions: TimeSession[]) => void;
  addSession: (session: TimeSession) => void;
  updateSession: (session: TimeSession) => void;
  removeSession: (id: string) => void;

  setRunningSessions: (sessions: TimeSession[]) => void;

  setProjectStats: (projectId: string, stats: ProjectStats) => void;

  setSelectedProjectId: (id?: string) => void;
  setSelectedDate: (date: Date) => void;

  // Timer setters
  setTimerProjectId: (id: string) => void;
  setTimerMinutes: (minutes: number) => void;
  setTimerTimeLeft: (time: number) => void;
  setTimerIsRunning: (running: boolean) => void;
  setTimerInitialTime: (time: number) => void;
  setTimerSessionId: (id: string | null) => void;
  setTimerStartTime: (time: string | null) => void;
  resetTimer: () => void;
}

export const useStore = create<AppState>((set) => ({
  // Initial state
  clients: [],
  projects: [],
  sessions: [],
  runningSessions: [],
  projectStats: new Map(),
  selectedDate: new Date(),

  // Timer initial state
  timerProjectId: '',
  timerMinutes: 25,
  timerTimeLeft: 0,
  timerIsRunning: false,
  timerInitialTime: 0,
  timerSessionId: null,
  timerStartTime: null,

  // Clients
  setClients: (clients) => set({ clients }),
  addClient: (client) => set((state) => ({ clients: [...state.clients, client] })),
  updateClient: (client) => set((state) => ({
    clients: state.clients.map((c) => (c.id === client.id ? client : c)),
  })),
  removeClient: (id) => set((state) => ({
    clients: state.clients.filter((c) => c.id !== id),
  })),

  // Projects
  setProjects: (projects) => set({ projects }),
  addProject: (project) => set((state) => ({ projects: [...state.projects, project] })),
  updateProject: (project) => set((state) => ({
    projects: state.projects.map((p) => (p.id === project.id ? project : p)),
  })),
  removeProject: (id) => set((state) => ({
    projects: state.projects.filter((p) => p.id !== id),
  })),

  // Sessions
  setSessions: (sessions) => set({ sessions }),
  addSession: (session) => set((state) => ({ sessions: [session, ...state.sessions] })),
  updateSession: (session) => set((state) => ({
    sessions: state.sessions.map((s) => (s.id === session.id ? session : s)),
    runningSessions: state.runningSessions.map((s) => (s.id === session.id ? session : s)),
  })),
  removeSession: (id) => set((state) => ({
    sessions: state.sessions.filter((s) => s.id !== id),
    runningSessions: state.runningSessions.filter((s) => s.id !== id),
  })),

  setRunningSessions: (runningSessions) => set({ runningSessions }),

  // Stats
  setProjectStats: (projectId, stats) => set((state) => {
    const newStats = new Map(state.projectStats);
    newStats.set(projectId, stats);
    return { projectStats: newStats };
  }),

  // UI
  setSelectedProjectId: (id) => set({ selectedProjectId: id }),
  setSelectedDate: (date) => set({ selectedDate: date }),

  // Timer
  setTimerProjectId: (id) => set({ timerProjectId: id }),
  setTimerMinutes: (minutes) => set({ timerMinutes: minutes }),
  setTimerTimeLeft: (time) => set({ timerTimeLeft: time }),
  setTimerIsRunning: (running) => set({ timerIsRunning: running }),
  setTimerInitialTime: (time) => set({ timerInitialTime: time }),
  setTimerSessionId: (id) => set({ timerSessionId: id }),
  setTimerStartTime: (time) => set({ timerStartTime: time }),
  resetTimer: () => set({
    timerProjectId: '',
    timerMinutes: 25,
    timerTimeLeft: 0,
    timerIsRunning: false,
    timerInitialTime: 0,
    timerSessionId: null,
    timerStartTime: null,
  }),
}));
