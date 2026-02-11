import { useState, useEffect } from 'react';
import { Clock, Calendar, CalendarCheck } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useTauriCommands } from '../hooks/useTauriCommands';
import type { ProjectTimeBreakdown } from '../types';

const formatHours = (hours: number) => {
  const totalSeconds = Math.floor(hours * 3600);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};

const Tiempo = () => {
  const { projects } = useStore();
  const tauri = useTauriCommands();

  const today = new Date().toISOString().split('T')[0];
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .split('T')[0];

  const [startDate, setStartDate] = useState(firstOfMonth);
  const [endDate, setEndDate] = useState(today);
  const [breakdown, setBreakdown] = useState<ProjectTimeBreakdown[]>([]);
  const [selectedProjectIds, setSelectedProjectIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [startDate, endDate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await tauri.stats.getDateRangeStats(startDate, endDate);
      // Sort alphabetically A-Z
      const sorted = data.sort((a, b) => a.project_name.localeCompare(b.project_name));
      setBreakdown(sorted);
    } catch (error) {
      console.error('Error loading time data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleProject = (projectId: string) => {
    setSelectedProjectIds((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  };

  const selectAll = () => setSelectedProjectIds(new Set(breakdown.map((b) => b.project_id)));
  const clearAll = () => setSelectedProjectIds(new Set());

  const visibleBreakdown =
    selectedProjectIds.size === 0
      ? breakdown
      : breakdown.filter((b) => selectedProjectIds.has(b.project_id));

  const totalHours = visibleBreakdown.reduce((sum, b) => sum + b.total_hours, 0);
  const maxHours = Math.max(...visibleBreakdown.map((b) => b.total_hours), 0.01);

  const getProjectColor = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    return project?.color || '#3b82f6';
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Tiempo por Proyecto</h1>
        <p className="text-gray-600 mt-2">Horas trabajadas por proyecto en el rango de fechas seleccionado</p>
      </div>

      {/* Date range + totals */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Calendar size={20} className="text-gray-500" />
            <span className="font-medium text-gray-700">Rango:</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
            <span className="text-gray-500">—</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
            <button
              onClick={() => { setStartDate(today); setEndDate(today); }}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1.5 text-sm"
            >
              <CalendarCheck size={16} /> Hoy
            </button>
            <button
              onClick={() => { setStartDate(firstOfMonth); setEndDate(today); }}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
            >
              Este mes
            </button>
          </div>
          <div className="ml-auto text-right">
            <div className="text-sm text-gray-500">Total visible</div>
            <div className="text-2xl font-bold text-blue-600">{formatHours(totalHours)}</div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Cargando datos...</p>
        </div>
      ) : breakdown.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-500 text-lg">No hay sesiones en este rango de fechas</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Project filter panel */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 h-fit">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 text-sm">Proyectos</h3>
              <div className="flex gap-2">
                <button onClick={selectAll} className="text-xs text-blue-600 hover:underline">Todos</button>
                <span className="text-gray-300">|</span>
                <button onClick={clearAll} className="text-xs text-gray-500 hover:underline">Ninguno</button>
              </div>
            </div>
            <div className="space-y-1.5">
              {breakdown.map((item) => {
                const isSelected = selectedProjectIds.size === 0 || selectedProjectIds.has(item.project_id);
                return (
                  <button
                    key={item.project_id}
                    onClick={() => toggleProject(item.project_id)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors text-sm ${
                      isSelected ? 'bg-blue-50 text-blue-900' : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: getProjectColor(item.project_id) }}
                    />
                    <span className="truncate flex-1">{item.project_name}</span>
                    <span className="text-xs font-mono flex-shrink-0">{item.total_hours.toFixed(1)}h</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bars chart */}
          <div className="lg:col-span-3 bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-6">
              <Clock size={20} className="text-blue-600" />
              <h3 className="font-semibold text-gray-900">
                {visibleBreakdown.length} {visibleBreakdown.length === 1 ? 'proyecto' : 'proyectos'}
              </h3>
            </div>

            <div className="space-y-4">
              {visibleBreakdown.map((item) => {
                const pct = (item.total_hours / maxHours) * 100;
                const color = getProjectColor(item.project_id);
                return (
                  <div key={item.project_id}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                        <span className="text-sm font-medium text-gray-900 truncate">{item.project_name}</span>
                        {item.client_name && (
                          <span className="text-xs text-gray-400 truncate">— {item.client_name}</span>
                        )}
                      </div>
                      <span className="text-sm font-mono font-semibold text-gray-900 ml-4 flex-shrink-0">
                        {formatHours(item.total_hours)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${pct}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary row */}
            <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-between">
              <span className="text-sm text-gray-500">Total</span>
              <span className="text-lg font-bold text-gray-900">{formatHours(totalHours)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tiempo;
