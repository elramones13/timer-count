import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { useTauriCommands } from '../hooks/useTauriCommands';
import TimerCard from '../components/TimerCard';

const Dashboard = () => {
  const { projects, runningSessions, setRunningSessions, addSession, updateSession } = useStore();
  const tauri = useTauriCommands();

  useEffect(() => {
    loadRunningSessions();
  }, []);

  const loadRunningSessions = async () => {
    try {
      const sessions = await tauri.sessions.getRunning();
      setRunningSessions(sessions);
    } catch (error) {
      console.error('Error loading running sessions:', error);
    }
  };

  const handleStartTimer = async (projectId: string) => {
    try {
      const session = await tauri.sessions.start(projectId);
      addSession(session);
      setRunningSessions([...runningSessions, session]);
    } catch (error) {
      console.error('Error starting timer:', error);
    }
  };

  const handleStopTimer = async (sessionId: string, notes?: string) => {
    try {
      const updatedSession = await tauri.sessions.stop(sessionId, notes);
      updateSession(updatedSession);
      setRunningSessions(runningSessions.filter((s) => s.id !== sessionId));
    } catch (error) {
      console.error('Error stopping timer:', error);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Timer Count</h1>
        <p className="text-gray-600 mt-2">
          Inicia un cronómetro en cualquier proyecto. Todos los registros se guardan automáticamente.
        </p>
      </div>

      {/* Running Timers Section */}
      {runningSessions.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            ⏱️ Cronómetros Activos ({runningSessions.length})
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {runningSessions.map((session) => {
              const project = projects.find((p) => p.id === session.project_id);
              if (!project) return null;

              return (
                <TimerCard
                  key={project.id}
                  project={project}
                  session={session}
                  onStart={() => {}}
                  onStop={(notes) => handleStopTimer(session.id, notes)}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* All Projects Section */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          📋 Todos los Proyectos ({projects.length})
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {projects.map((project) => {
            const runningSession = runningSessions.find((s) => s.project_id === project.id);

            return (
              <TimerCard
                key={project.id}
                project={project}
                session={runningSession}
                onStart={() => handleStartTimer(project.id)}
                onStop={(notes) => runningSession && handleStopTimer(runningSession.id, notes)}
              />
            );
          })}
        </div>

        {projects.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
            <p className="text-gray-500 text-lg mb-2">No hay proyectos todavía</p>
            <p className="text-gray-400 mb-4">Crea tu primer proyecto para empezar a trackear tiempo</p>
            <a
              href="/projects"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Crear Proyecto
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
