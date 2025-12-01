import { useState, useEffect } from 'react';
import { Calendar, Clock, Trash2, ChevronDown, ChevronRight, CalendarCheck } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useTauriCommands } from '../hooks/useTauriCommands';
import type { DailyStats, TimeSession } from '../types';
import { ask } from '@tauri-apps/plugin-dialog';

const Reports = () => {
  const { projects, removeSession } = useStore();
  const tauri = useTauriCommands();
  const [searchParams] = useSearchParams();
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [allSessions, setAllSessions] = useState<TimeSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());

  // Check if date parameter is provided in URL
  const urlDate = searchParams.get('date');

  // Default to last 30 days or to the date from URL
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);

  const [startDate, setStartDate] = useState(
    urlDate || thirtyDaysAgo.toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(
    urlDate || today.toISOString().split('T')[0]
  );

  useEffect(() => {
    loadData();
  }, [startDate, endDate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [stats, sessions] = await Promise.all([
        tauri.stats.getDailyStats(startDate, endDate),
        tauri.sessions.getAll()
      ]);
      setDailyStats(stats);
      setAllSessions(sessions);
    } catch (error) {
      console.error('Error loading data:', error);
      alert(`Error al cargar datos: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const formatHours = (hours: number) => {
    const totalSeconds = Math.floor(hours * 3600);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;

    if (h > 0) {
      return `${h}h ${m}m ${s}s`;
    } else if (m > 0) {
      return `${m}m ${s}s`;
    } else {
      return `${s}s`;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Toggle project expansion
  const toggleProject = (date: string, projectId: string) => {
    const key = `${date}-${projectId}`;
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedProjects(newExpanded);
  };

  // Group sessions by date, then by project
  const sessionsByDate = allSessions
    .filter(session => {
      if (!session.start_time) return false;
      const sessionDate = new Date(session.start_time).toISOString().split('T')[0];
      return sessionDate >= startDate && sessionDate <= endDate && session.end_time;
    })
    .reduce((acc, session) => {
      const date = new Date(session.start_time).toISOString().split('T')[0];
      if (!acc[date]) acc[date] = {};
      if (!acc[date][session.project_id]) acc[date][session.project_id] = [];
      acc[date][session.project_id].push(session);
      return acc;
    }, {} as Record<string, Record<string, TimeSession[]>>);

  const totalHours = dailyStats.reduce((sum, day) => sum + day.total_hours, 0);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Reportes</h1>
        <p className="text-gray-600 mt-2">Registros de tiempo agrupados por día y proyecto</p>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Calendar size={20} className="text-gray-500" />
            <span className="font-medium text-gray-700">Rango de fechas:</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
            <span className="text-gray-500">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
            <button
              onClick={() => {
                const today = new Date().toISOString().split('T')[0];
                setStartDate(today);
                setEndDate(today);
              }}
              className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
              title="Seleccionar hoy"
            >
              <CalendarCheck size={18} />
              Hoy
            </button>
          </div>
          <div className="ml-auto">
            <div className="text-right">
              <div className="text-sm text-gray-500">Total</div>
              <div className="text-2xl font-bold text-blue-600">{formatHours(totalHours)}</div>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Cargando datos...</p>
        </div>
      ) : Object.keys(sessionsByDate).length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-500 text-lg">No hay registros en este rango de fechas</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(sessionsByDate)
            .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
            .map(([date, projectsData]) => {
              const dayStats = dailyStats.find(s => s.date === date);
              const dayTotalHours = dayStats?.total_hours || 0;

              return (
                <div key={date} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900 capitalize">
                        {formatDate(date)}
                      </h3>
                      <div className="flex items-center gap-2 text-blue-600 font-semibold">
                        <Clock size={18} />
                        {formatHours(dayTotalHours)}
                      </div>
                    </div>
                  </div>

                  <div className="divide-y divide-gray-200">
                    {Object.entries(projectsData).map(([projectId, sessions]) => {
                      const project = projects.find(p => p.id === projectId);
                      const projectKey = `${date}-${projectId}`;
                      const isExpanded = expandedProjects.has(projectKey);

                      // Calculate total duration for this project on this day
                      const projectTotalSeconds = sessions.reduce((sum, session) =>
                        sum + (session.duration_seconds || 0), 0);
                      const projectTotalHours = projectTotalSeconds / 3600;

                      return (
                        <div key={projectId}>
                          {/* Project Header - Clickable to expand/collapse */}
                          <div
                            onClick={() => toggleProject(date, projectId)}
                            className="px-6 py-4 hover:bg-gray-50 cursor-pointer"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 flex-1">
                                {isExpanded ? (
                                  <ChevronDown size={20} className="text-gray-400" />
                                ) : (
                                  <ChevronRight size={20} className="text-gray-400" />
                                )}
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: project?.color || '#3b82f6' }}
                                />
                                <div className="font-medium text-gray-900">
                                  {project?.name || 'Proyecto desconocido'}
                                </div>
                                <div className="text-sm text-gray-500">
                                  ({sessions.length} {sessions.length === 1 ? 'sesión' : 'sesiones'})
                                </div>
                              </div>
                              <div className="font-semibold text-gray-900">
                                {formatHours(projectTotalHours)}
                              </div>
                            </div>
                          </div>

                          {/* Expanded Sessions */}
                          {isExpanded && (
                            <div className="bg-gray-50 border-t border-gray-200">
                              {sessions
                                .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
                                .map((session) => {
                                  const duration = session.duration_seconds ? session.duration_seconds / 3600 : 0;
                                  const startTime = new Date(session.start_time).toLocaleTimeString('es-ES', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  });
                                  const endTime = session.end_time ? new Date(session.end_time).toLocaleTimeString('es-ES', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  }) : '-';

                                  const handleDelete = async (e: React.MouseEvent) => {
                                    e.stopPropagation();
                                    try {
                                      const confirmed = await ask('¿Estás seguro de borrar este registro?', {
                                        title: 'Confirmar eliminación',
                                        kind: 'warning'
                                      });

                                      if (confirmed) {
                                        await tauri.sessions.delete(session.id);
                                        removeSession(session.id);
                                        await loadData();
                                      }
                                    } catch (error) {
                                      console.error('Error deleting session:', error);
                                      alert(`Error al borrar el registro: ${error}`);
                                    }
                                  };

                                  return (
                                    <div key={session.id} className="px-6 py-3 ml-8 hover:bg-gray-100 group border-l-2 border-gray-300">
                                      <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                          <div className="flex items-center gap-3 text-sm">
                                            <div className="text-gray-500">
                                              {startTime} - {endTime}
                                            </div>
                                            <div className="font-medium text-gray-700">
                                              {formatHours(duration)}
                                            </div>
                                          </div>
                                          {session.notes && (
                                            <div className="mt-1 text-sm text-gray-600">
                                              {session.notes}
                                            </div>
                                          )}
                                        </div>
                                        <button
                                          onClick={handleDelete}
                                          className="opacity-0 group-hover:opacity-100 p-2 text-red-600 hover:bg-red-50 rounded transition-opacity"
                                          title="Borrar registro"
                                        >
                                          <Trash2 size={16} />
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
};

export default Reports;
