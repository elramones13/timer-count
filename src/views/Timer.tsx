import { useEffect } from 'react';
import { Timer as TimerIcon, Play, Pause, RotateCcw, Bell, Check } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useTauriCommands } from '../hooks/useTauriCommands';
import { sendNotification } from '@tauri-apps/plugin-notification';
import { listen } from '@tauri-apps/api/event';

const Timer = () => {
  const {
    projects,
    timerProjectId,
    timerMinutes,
    timerTimeLeft,
    timerIsRunning,
    timerInitialTime,
    timerSessionId,
    timerStartTime,
    setTimerProjectId,
    setTimerMinutes,
    setTimerTimeLeft,
    setTimerIsRunning,
    setTimerInitialTime,
    setTimerSessionId,
    setTimerStartTime,
    resetTimer,
  } = useStore();
  const tauri = useTauriCommands();

  // Listen for system events and auto-pause timer
  useEffect(() => {
    const unlistenPromises: Promise<() => void>[] = [];

    const handleSystemPause = async () => {
      console.log('System event detected - auto-saving session');

      // The backend already stopped all sessions automatically
      if (timerIsRunning) {
        // Stop the timer UI
        setTimerIsRunning(false);

        // Show notification that session was auto-saved
        try {
          const project = projects.find(p => p.id === timerProjectId);
          const projectName = project?.name || 'Proyecto';
          await sendNotification({
            title: '⏸️ Sesión Auto-pausada',
            body: `Tu sesión de ${projectName} se guardó automáticamente`,
          });
        } catch (notifError) {
          console.error('Error sending notification:', notifError);
        }

        // Don't reset the timer completely - keep the session info
        // so the user can see what was saved
        // Just mark it as stopped
        setTimerSessionId(null);
        setTimerStartTime(null);
      }
    };

    // Listen for screen lock
    unlistenPromises.push(
      listen('screen-lock', handleSystemPause)
    );

    // Cleanup listeners on unmount
    return () => {
      Promise.all(unlistenPromises).then(unlisteners => {
        unlisteners.forEach(unlisten => unlisten());
      });
    };
  }, [timerIsRunning, timerProjectId, projects, setTimerIsRunning, setTimerSessionId, setTimerStartTime]);

  const handleStart = async () => {
    // Validar que haya un proyecto seleccionado
    if (!timerProjectId) {
      alert('Debes seleccionar un proyecto para usar el temporizador');
      return;
    }

    if (timerTimeLeft === 0) {
      const seconds = timerMinutes * 60;
      setTimerTimeLeft(seconds);
      setTimerInitialTime(seconds);

      // Crear sesión
      try {
        const start = new Date().toISOString();
        const session = await tauri.sessions.start(timerProjectId);
        setTimerSessionId(session.id);
        setTimerStartTime(start);
        console.log('Sesión iniciada:', session.id);
      } catch (error) {
        console.error('Error creando sesión:', error);
        alert('Error al crear la sesión del temporizador');
        return;
      }
    }
    setTimerIsRunning(true);
  };

  const handlePause = () => {
    setTimerIsRunning(false);
  };

  const handleReset = async () => {
    setTimerIsRunning(false);

    // Si hay una sesión activa, detenerla sin guardarla
    if (timerSessionId) {
      try {
        await tauri.sessions.delete(timerSessionId);
        console.log('Sesión cancelada');
      } catch (error) {
        console.error('Error cancelando sesión:', error);
      }
    }

    resetTimer();
  };

  const handleComplete = async () => {
    setTimerIsRunning(false);

    // Guardar la sesión con el tiempo actual (aunque no haya terminado)
    if (timerProjectId && timerSessionId && timerStartTime) {
      try {
        const endTime = new Date().toISOString();
        await tauri.sessions.stop(timerSessionId, endTime);
        console.log('Sesión completada antes de tiempo y guardada');

        // Mostrar notificación de tarea completada
        const project = projects.find(p => p.id === timerProjectId);
        const projectName = project?.name || 'Temporizador';

        try {
          await sendNotification({
            title: '✅ Tarea Completada',
            body: `Has completado la tarea de ${projectName}!`,
          });
        } catch (notifError) {
          console.error('Error sending notification:', notifError);
        }
      } catch (error) {
        console.error('Error guardando sesión:', error);
      }
    }

    // Resetear todo
    resetTimer();
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    if (timerInitialTime === 0) return 0;
    return ((timerInitialTime - timerTimeLeft) / timerInitialTime) * 100;
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Temporizador</h1>
        <p className="text-gray-600 mt-2">Configura una cuenta regresiva para tus tareas</p>
      </div>

      <div className="max-w-2xl mx-auto">
        {/* Configuration */}
        <div className="bg-white rounded-lg border border-gray-200 p-8 mb-6">
          <div className="space-y-6">
            {/* Project Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Proyecto <span className="text-red-600">*</span>
              </label>
              <select
                value={timerProjectId}
                onChange={(e) => setTimerProjectId(e.target.value)}
                disabled={timerIsRunning || timerTimeLeft > 0}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <option value="">Selecciona un proyecto</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Minutes Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duración (minutos)
              </label>
              <input
                type="number"
                min="1"
                max="999"
                value={timerMinutes}
                onChange={(e) => setTimerMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                disabled={timerIsRunning || timerTimeLeft > 0}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 text-lg"
              />
            </div>
          </div>
        </div>

        {/* Timer Display */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border-2 border-blue-200 p-12 mb-6">
          <div className="text-center">
            <div className="mb-6">
              <TimerIcon size={48} className="mx-auto text-blue-600" />
            </div>

            {/* Time Display */}
            <div className="text-8xl font-bold text-gray-900 mb-8 font-mono tracking-tight">
              {formatTime(timerTimeLeft)}
            </div>

            {/* Progress Bar */}
            {timerTimeLeft > 0 && (
              <div className="mb-8">
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-blue-600 h-4 rounded-full transition-all duration-1000"
                    style={{ width: `${getProgress()}%` }}
                  />
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center justify-center gap-4">
              {!timerIsRunning ? (
                <button
                  onClick={handleStart}
                  className="px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-3 text-lg font-semibold"
                >
                  <Play size={24} />
                  Iniciar
                </button>
              ) : (
                <button
                  onClick={handlePause}
                  className="px-8 py-4 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors flex items-center gap-3 text-lg font-semibold"
                >
                  <Pause size={24} />
                  Pausar
                </button>
              )}

              {timerTimeLeft > 0 && timerProjectId && (
                <button
                  onClick={handleComplete}
                  className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-3 text-lg font-semibold"
                >
                  <Check size={24} />
                  Completar
                </button>
              )}

              <button
                onClick={handleReset}
                disabled={timerTimeLeft === 0 && !timerIsRunning}
                className="px-8 py-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 text-lg font-semibold"
              >
                <RotateCcw size={24} />
                Reiniciar
              </button>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
          <div className="flex items-start gap-3">
            <Bell className="text-blue-600 mt-0.5" size={20} />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">Cómo funciona</p>
              <ul className="text-blue-700 space-y-1">
                <li>• Debes seleccionar un proyecto para usar el temporizador</li>
                <li>• El tiempo se guardará automáticamente en los reportes</li>
                <li>• Usa el botón "Completar" si terminas la tarea antes del tiempo programado</li>
                <li>• Cuando el temporizador llegue a cero, recibirás una notificación y se reproducirá un sonido</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Timer;
