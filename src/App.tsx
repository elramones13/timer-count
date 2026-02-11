import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { listen } from '@tauri-apps/api/event';
import { useStore } from './store/useStore';
import { useTauriCommands } from './hooks/useTauriCommands';
import Layout from './components/Layout';
import Dashboard from './views/Dashboard';
import Projects from './views/Projects';
import Stats from './views/Stats';
import Reports from './views/Reports';
import Calendar from './views/Calendar';
import Tiempo from './views/Tiempo';
import TrayManager from './views/TrayManager';
import Settings from './views/Settings';
import type { Project } from './types';

const TRAY_PINNED_KEY = 'tray_pinned_ids';

function App() {
  const {
    projects,
    setProjects,
    setSessions,
    runningSessions,
    setRunningSessions,
  } = useStore();
  const tauri = useTauriCommands();

  useEffect(() => {
    loadData();
    setupTrayListeners();
  }, []);

  useEffect(() => {
    // Update tray menu when projects or running sessions change
    if (projects.length > 0) {
      updateTrayMenu();
    }
  }, [projects, runningSessions]);

  const loadData = async () => {
    try {
      const [projectsData, sessions, runningSessionsData] = await Promise.all([
        tauri.projects.getAll(),
        tauri.sessions.getAll(),
        tauri.sessions.getRunning(),
      ]);
      setProjects(projectsData);
      setSessions(sessions);
      setRunningSessions(runningSessionsData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const updateTrayMenu = async () => {
    try {
      // Build tray list: active projects (A-Z) + pinned non-active projects (in saved order)
      const pinnedIds: string[] = JSON.parse(localStorage.getItem(TRAY_PINNED_KEY) || '[]');

      const activeProjects = projects
        .filter((p) => p.status === 'active')
        .sort((a, b) => a.name.localeCompare(b.name));

      const pinnedProjects = pinnedIds
        .map((id) => projects.find((p) => p.id === id))
        .filter((p): p is Project => p !== undefined && p.status !== 'active');

      await tauri.tray.updateMenu([...activeProjects, ...pinnedProjects], runningSessions);
    } catch (error) {
      console.error('Error updating tray menu:', error);
    }
  };

  const setupTrayListeners = async () => {
    // Listen for tray events - when tray toggles a project, reload data
    await listen('tray-project-toggled', async () => {
      try {
        // Reload all data to sync with tray actions
        await loadData();
      } catch (error) {
        console.error('Error syncing after tray action:', error);
      }
    });
  };

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/tiempo" element={<Tiempo />} />
          <Route path="/tray" element={<TrayManager />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
