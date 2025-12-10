import { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useTauriCommands } from '../hooks/useTauriCommands';
import TimerCard from '../components/TimerCard';
import type { Project } from '../types';
import { STATUS_LABELS } from '../types';

const Dashboard = () => {
  const { projects, runningSessions, setRunningSessions, addSession, updateSession } = useStore();
  const tauri = useTauriCommands();
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['active']));

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

  const toggleGroup = (groupKey: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupKey)) {
      newExpanded.delete(groupKey);
    } else {
      newExpanded.add(groupKey);
    }
    setExpandedGroups(newExpanded);
  };

  const groupProjectsByStatus = () => {
    const groups: {
      [status: string]: {
        withDeadline: Project[];
        withoutDeadline: Project[];
      };
    } = {
      active: { withDeadline: [], withoutDeadline: [] },
      paused: { withDeadline: [], withoutDeadline: [] },
      completed: { withDeadline: [], withoutDeadline: [] },
      archived: { withDeadline: [], withoutDeadline: [] },
    };

    projects.forEach((project) => {
      const statusGroup = groups[project.status];
      if (!statusGroup) return;

      if (project.deadline) {
        statusGroup.withDeadline.push(project);
      } else {
        statusGroup.withoutDeadline.push(project);
      }
    });

    // Sort projects with deadline by deadline date
    Object.values(groups).forEach((group) => {
      group.withDeadline.sort((a, b) => {
        const dateA = new Date(a.deadline!).getTime();
        const dateB = new Date(b.deadline!).getTime();
        return dateA - dateB;
      });
    });

    return groups;
  };

  const groupedProjects = groupProjectsByStatus();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'paused':
        return 'text-yellow-600 bg-yellow-100';
      case 'completed':
        return 'text-blue-600 bg-blue-100';
      case 'archived':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return '🟢';
      case 'paused':
        return '🟡';
      case 'completed':
        return '🔵';
      case 'archived':
        return '⚪';
      default:
        return '📋';
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

      {/* Projects Grouped by Status */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          📋 Todos los Proyectos ({projects.length})
        </h2>

        {projects.length === 0 ? (
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
        ) : (
          <div className="space-y-4">
            {(['active', 'paused', 'completed', 'archived'] as const).map((status) => {
              const group = groupedProjects[status];
              const totalProjects = group.withDeadline.length + group.withoutDeadline.length;

              if (totalProjects === 0) return null;

              const isExpanded = expandedGroups.has(status);

              return (
                <div key={status} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  {/* Status Header */}
                  <button
                    onClick={() => toggleGroup(status)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                      <span className="text-lg font-semibold">
                        {getStatusIcon(status)} {STATUS_LABELS[status]}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status)}`}>
                        {totalProjects} {totalProjects === 1 ? 'proyecto' : 'proyectos'}
                      </span>
                    </div>
                  </button>

                  {/* Projects List */}
                  {isExpanded && (
                    <div className="px-6 pb-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                        {/* Projects with Deadline first (sorted by deadline) */}
                        {group.withDeadline.map((project) => {
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

                        {/* Projects without Deadline */}
                        {group.withoutDeadline.map((project) => {
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
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
