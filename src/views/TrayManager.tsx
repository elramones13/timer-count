import { useState, useEffect, useRef } from 'react';
import { GripVertical, Plus, X, Lock } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useTauriCommands } from '../hooks/useTauriCommands';
import type { Project } from '../types';

const TRAY_PINNED_KEY = 'tray_pinned_ids';

const TrayManager = () => {
  const { projects, runningSessions } = useStore();
  const tauri = useTauriCommands();

  // Active projects are always shown (automatic, cannot be removed)
  const activeProjects = projects
    .filter((p) => p.status === 'active')
    .sort((a, b) => a.name.localeCompare(b.name));

  // Pinned project IDs (non-active projects manually added)
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(TRAY_PINNED_KEY);
    if (stored) {
      try {
        setPinnedIds(JSON.parse(stored));
      } catch {
        setPinnedIds([]);
      }
    }
  }, []);

  // Pinned projects objects (only non-active ones, in order)
  const pinnedProjects = pinnedIds
    .map((id) => projects.find((p) => p.id === id))
    .filter((p): p is Project => p !== undefined);

  // Projects that can be added (not active, not already pinned)
  const availableProjects = projects
    .filter((p) => p.status !== 'active' && !pinnedIds.includes(p.id))
    .sort((a, b) => a.name.localeCompare(b.name));

  const addProject = (projectId: string) => {
    setPinnedIds((prev) => [...prev, projectId]);
    setSaved(false);
  };

  const removeProject = (projectId: string) => {
    setPinnedIds((prev) => prev.filter((id) => id !== projectId));
    setSaved(false);
  };

  // Drag and drop handlers for pinned list
  const handleDragStart = (index: number) => {
    dragItem.current = index;
  };

  const handleDragEnter = (index: number) => {
    dragOverItem.current = index;
  };

  const handleDragEnd = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    if (dragItem.current === dragOverItem.current) return;

    const newOrder = [...pinnedIds];
    const dragged = newOrder.splice(dragItem.current, 1)[0];
    newOrder.splice(dragOverItem.current, 0, dragged);
    setPinnedIds(newOrder);
    dragItem.current = null;
    dragOverItem.current = null;
    setSaved(false);
  };

  const handleSave = async () => {
    localStorage.setItem(TRAY_PINNED_KEY, JSON.stringify(pinnedIds));

    // Build the ordered tray project list: active first (A-Z), then pinned in order
    const trayProjects = [
      ...activeProjects,
      ...pinnedProjects.filter((p) => p.status !== 'active'),
    ];

    try {
      await tauri.tray.updateMenu(trayProjects, runningSessions);
    } catch (error) {
      console.error('Error updating tray:', error);
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const getStatusBadge = (status: Project['status']) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-700',
      paused: 'bg-yellow-100 text-yellow-700',
      completed: 'bg-blue-100 text-blue-700',
      archived: 'bg-gray-100 text-gray-600',
    };
    return colors[status] || 'bg-gray-100 text-gray-600';
  };

  const totalTrayCount = activeProjects.length + pinnedProjects.length;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Gestión del Tray</h1>
        <p className="text-gray-600 mt-2">
          Configura qué proyectos aparecen en el menú del tray. Los proyectos activos
          siempre se muestran automáticamente.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Tray list */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">
              En el Tray
              <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                {totalTrayCount}
              </span>
            </h2>
          </div>

          <div className="p-4 space-y-2">
            {/* Active projects - locked */}
            {activeProjects.map((project) => (
              <div
                key={project.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-gray-200 bg-green-50"
              >
                <Lock size={14} className="text-green-600 flex-shrink-0" />
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: project.color || '#3b82f6' }}
                />
                <span className="text-sm font-medium text-gray-900 flex-1 truncate">
                  {project.name}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusBadge(project.status)}`}>
                  Activo
                </span>
              </div>
            ))}

            {/* Pinned projects - draggable */}
            {pinnedProjects.map((project, index) => (
              <div
                key={project.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragEnter={() => handleDragEnter(index)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => e.preventDefault()}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-gray-200 bg-white cursor-grab active:cursor-grabbing hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                <GripVertical size={14} className="text-gray-400 flex-shrink-0" />
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: project.color || '#3b82f6' }}
                />
                <span className="text-sm font-medium text-gray-900 flex-1 truncate">
                  {project.name}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusBadge(project.status)}`}>
                  {project.status}
                </span>
                <button
                  onClick={() => removeProject(project.id)}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                  title="Quitar del tray"
                >
                  <X size={14} />
                </button>
              </div>
            ))}

            {totalTrayCount === 0 && (
              <p className="text-center text-gray-400 text-sm py-8">
                No hay proyectos en el tray
              </p>
            )}
          </div>

          <div className="px-4 pb-4">
            <button
              onClick={handleSave}
              className={`w-full py-2.5 rounded-lg font-medium transition-colors ${
                saved
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-900 text-white hover:bg-gray-700'
              }`}
            >
              {saved ? '¡Guardado y aplicado!' : 'Guardar y aplicar al Tray'}
            </button>
          </div>
        </div>

        {/* Right: Available projects */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="font-semibold text-gray-900">
              Disponibles para añadir
              <span className="ml-2 px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full text-sm font-medium">
                {availableProjects.length}
              </span>
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Proyectos no activos que puedes fijar en el tray
            </p>
          </div>

          <div className="p-4 space-y-2">
            {availableProjects.map((project) => (
              <div
                key={project.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-gray-200 hover:border-blue-200 hover:bg-blue-50 transition-colors"
              >
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: project.color || '#3b82f6' }}
                />
                <span className="text-sm font-medium text-gray-900 flex-1 truncate">
                  {project.name}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusBadge(project.status)}`}>
                  {project.status}
                </span>
                <button
                  onClick={() => addProject(project.id)}
                  className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex-shrink-0"
                  title="Añadir al tray"
                >
                  <Plus size={13} />
                </button>
              </div>
            ))}

            {availableProjects.length === 0 && (
              <p className="text-center text-gray-400 text-sm py-8">
                Todos los proyectos no activos ya están en el tray
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        <strong>Cómo funciona:</strong> Los proyectos <strong>activos</strong> aparecen siempre
        automáticamente (con el candado). Puedes añadir cualquier otro proyecto arrastrando desde
        "Disponibles". Arrastra los proyectos fijados para reordenarlos. Pulsa{' '}
        <strong>"Guardar y aplicar"</strong> para que los cambios se reflejen en el tray.
      </div>
    </div>
  );
};

export default TrayManager;
