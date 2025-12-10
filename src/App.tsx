import { useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { listen } from '@tauri-apps/api/event';
import { convertFileSrc } from '@tauri-apps/api/core';
import { resolveResource } from '@tauri-apps/api/path';
import { useStore } from './store/useStore';
import { useTauriCommands } from './hooks/useTauriCommands';
import { sendNotification } from '@tauri-apps/plugin-notification';
import Layout from './components/Layout';
import Dashboard from './views/Dashboard';
import Projects from './views/Projects';
import Stats from './views/Stats';
import Reports from './views/Reports';
import Calendar from './views/Calendar';
import Timer from './views/Timer';
import Settings from './views/Settings';

function App() {
  const {
    projects,
    setProjects,
    setSessions,
    runningSessions,
    setRunningSessions,
    addSession,
    updateSession,
    timerProjectId,
    timerTimeLeft,
    timerIsRunning,
    timerSessionId,
    timerStartTime,
    setTimerTimeLeft,
    setTimerIsRunning,
    resetTimer,
  } = useStore();
  const tauri = useTauriCommands();
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    loadData();
    setupTrayListeners();

    // Cargar el sonido de alarma usando Tauri assets
    const loadAlarmSound = async () => {
      try {
        const resourcePath = await resolveResource('alarm.mp3');
        const assetUrl = convertFileSrc(resourcePath);
        audioRef.current = new Audio(assetUrl);
        console.log('Alarm sound loaded:', assetUrl);
      } catch (error) {
        console.error('Error loading alarm sound:', error);
        // Fallback: try loading from public
        audioRef.current = new Audio('/alarm.mp3');
      }
    };

    loadAlarmSound();
  }, []);

  // Timer logic - runs globally even when not on Timer page
  useEffect(() => {
    if (timerIsRunning && timerTimeLeft > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimerTimeLeft(timerTimeLeft - 1);
        if (timerTimeLeft - 1 <= 0) {
          handleTimerComplete();
        }
      }, 1000);
    } else if (!timerIsRunning && timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [timerIsRunning, timerTimeLeft]);

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
      await tauri.tray.updateMenu(projects, runningSessions);
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

  const handleTimerComplete = async () => {
    setTimerIsRunning(false);

    // Reproducir sonido
    if (audioRef.current) {
      try {
        audioRef.current.volume = 0.5; // Volumen al 50%
        await audioRef.current.play();
      } catch (err) {
        console.error('Error playing sound:', err);
      }
    }

    // Guardar la sesión si hay un proyecto seleccionado
    if (timerProjectId && timerSessionId && timerStartTime) {
      try {
        const endTime = new Date().toISOString();
        await tauri.sessions.stop(timerSessionId, endTime);
        console.log('Sesión guardada correctamente');
        // Reload data to show the new session
        await loadData();
      } catch (error) {
        console.error('Error guardando sesión:', error);
      }
    }

    // Enviar notificación
    const project = projects.find(p => p.id === timerProjectId);
    const projectName = project?.name || 'Temporizador';

    try {
      await sendNotification({
        title: '⏰ Tiempo Completado',
        body: `El temporizador de ${projectName} ha finalizado!`,
      });
    } catch (error) {
      console.error('Error sending notification:', error);
    }

    // Resetear estados
    resetTimer();
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
          <Route path="/timer" element={<Timer />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
