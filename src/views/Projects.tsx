import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Clock, Calendar, X } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useTauriCommands } from '../hooks/useTauriCommands';
import type { Project, ProjectStats } from '../types';
import { getPriorityColor, getStatusColor } from '../utils/colors';
import { PRIORITY_LABELS, STATUS_LABELS } from '../types';

const Projects = () => {
  const { projects, addProject, updateProject, removeProject } = useStore();
  const tauri = useTauriCommands();
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectsStats, setProjectsStats] = useState<ProjectStats[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>(['active', 'paused']);
  const [deadlineFilter, setDeadlineFilter] = useState<string>('all');

  const getProjectStats = (projectId: string): ProjectStats | undefined => {
    return projectsStats.find(stat => stat.project_id === projectId);
  };

  const getDeadlineColor = (deadline: string | null): { bg: string; text: string; label: string } => {
    if (!deadline) return { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Sin deadline' };

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const deadlineDate = new Date(deadline);
    deadlineDate.setHours(0, 0, 0, 0);

    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const twoWeeksFromNow = new Date();
    twoWeeksFromNow.setDate(new Date().getDate() + 14);
    twoWeeksFromNow.setHours(0, 0, 0, 0);

    if (deadlineDate < now) {
      return { bg: 'bg-red-100', text: 'text-red-600', label: '🔴 Atrasado' };
    } else if (deadlineDate >= monday && deadlineDate <= sunday) {
      return { bg: 'bg-yellow-100', text: 'text-yellow-600', label: '🟡 Esta semana' };
    } else if (deadlineDate > twoWeeksFromNow) {
      return { bg: 'bg-green-100', text: 'text-green-600', label: '🟢 Con margen' };
    } else {
      return { bg: 'bg-yellow-100', text: 'text-yellow-600', label: '🟡 Próximo' };
    }
  };

  const ProjectCard = ({ project }: { project: Project }) => {
    const stats = getProjectStats(project.id);
    const usedHours = stats?.total_hours || 0;
    const estimatedHours = project.estimated_hours;
    const percentage = estimatedHours ? Math.min((usedHours / estimatedHours) * 100, 100) : 0;
    const isOverbudget = estimatedHours ? usedHours > estimatedHours : false;
    const deadlineColor = getDeadlineColor(project.deadline || null);

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
          </div>
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: project.color || '#3b82f6' }}
          />
        </div>

        {project.description && (
          <p className="text-sm text-gray-600 mb-4">{project.description}</p>
        )}

        <div className="flex flex-wrap gap-2 mb-4">
          <span className={`px-2 py-1 text-xs rounded ${getPriorityColor(project.priority)}`}>
            {PRIORITY_LABELS[project.priority]}
          </span>
          <span className={`px-2 py-1 text-xs rounded ${getStatusColor(project.status)}`}>
            {STATUS_LABELS[project.status]}
          </span>
          {project.deadline && (
            <span className={`px-2 py-1 text-xs rounded ${deadlineColor.bg} ${deadlineColor.text} font-medium`}>
              {deadlineColor.label}
            </span>
          )}
        </div>

        {project.estimated_hours && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>{usedHours.toFixed(1)}h / {estimatedHours}h</span>
              <span className={isOverbudget ? 'text-red-600 font-semibold' : ''}>
                {percentage.toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  isOverbudget ? 'bg-red-500' : 'bg-blue-500'
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        )}

        <div className="space-y-2 mb-4">
          {project.estimated_hours && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock size={16} />
              <span>Est: {project.estimated_hours}h</span>
            </div>
          )}

          {project.deadline && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar size={16} />
              <span>
                Deadline: {new Date(project.deadline).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => handleEdit(project)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded"
          >
            <Edit size={16} />
            Edit
          </button>
          <button
            onClick={() => handleDelete(project.id)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded"
          >
            <Trash2 size={16} />
            Delete
          </button>
        </div>
      </div>
    );
  };

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3b82f6',
    priority: 2,
    status: 'active' as Project['status'],
    estimatedHours: '',
    deadline: '',
  });

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const loadedProjects = await tauri.projects.getAll();
        console.log('Loaded projects from backend:', loadedProjects);
        useStore.setState({ projects: loadedProjects });
      } catch (error) {
        console.error('Error loading projects:', error);
      }
    };
    loadProjects();
  }, []);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const stats = await tauri.stats.getAllProjectsStats();
        setProjectsStats(stats);
      } catch (error) {
        console.error('Error loading project stats:', error);
      }
    };
    loadStats();
  }, [projects]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const parseNumber = (value: string): number | null => {
        if (!value || value.trim() === '') return null;
        const parsed = parseFloat(value);
        return isNaN(parsed) ? null : parsed;
      };

      const parsedEstimatedHours = parseNumber(formData.estimatedHours);

      const data = {
        name: formData.name,
        description: formData.description || null,
        clientId: editingProject?.client_id || null,
        color: formData.color,
        priority: formData.priority,
        status: formData.status,
        estimatedHours: parsedEstimatedHours,
        hoursPerDay: null,
        hoursPerWeek: null,
        deadline: formData.deadline ? new Date(formData.deadline + 'T00:00:00Z').toISOString() : null,
      };

      if (editingProject) {
        const updateData = { ...data, id: editingProject.id };
        const updated = await tauri.projects.update(updateData);
        updateProject(updated);
      } else {
        const created = await tauri.projects.create(data);
        addProject(created);
      }

      resetForm();
    } catch (error) {
      console.error('Error saving project:', error);
      console.error('Error details:', JSON.stringify(error));
      alert(`Error al guardar el proyecto: ${error}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this project?')) {
      try {
        await tauri.projects.delete(id);
        removeProject(id);
      } catch (error) {
        console.error('Error deleting project:', error);
        alert(`Error al borrar el proyecto: ${error}`);
      }
    }
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      description: project.description || '',
      color: project.color || '#3b82f6',
      priority: project.priority,
      status: project.status,
      estimatedHours: project.estimated_hours?.toString() || '',
      deadline: project.deadline ? (typeof project.deadline === 'string' ? project.deadline.split('T')[0] : '') : '',
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      color: '#3b82f6',
      priority: 2,
      status: 'active',
      estimatedHours: '',
      deadline: '',
    });
    setEditingProject(null);
    setShowModal(false);
  };

  const filterProjects = () => {
    return projects.filter((project) => {
      // Filter by status
      if (!statusFilter.includes(project.status)) {
        return false;
      }

      // Filter by deadline
      if (deadlineFilter !== 'all') {
        const deadlineColor = getDeadlineColor(project.deadline || null);

        if (deadlineFilter === 'overdue' && !deadlineColor.label.includes('Atrasado')) {
          return false;
        }
        if (deadlineFilter === 'thisWeek' && !deadlineColor.label.includes('Esta semana')) {
          return false;
        }
        if (deadlineFilter === 'upcoming' && !deadlineColor.label.includes('Próximo')) {
          return false;
        }
        if (deadlineFilter === 'longTerm' && !deadlineColor.label.includes('Con margen')) {
          return false;
        }
        if (deadlineFilter === 'noDeadline' && project.deadline) {
          return false;
        }
      }

      return true;
    });
  };

  const groupProjectsByStatus = () => {
    const filteredProjects = filterProjects();

    const groups = {
      active: [] as Project[],
      paused: [] as Project[],
      completed: [] as Project[],
      archived: [] as Project[],
    };

    filteredProjects.forEach((project) => {
      if (project.status === 'active') {
        groups.active.push(project);
      } else if (project.status === 'paused') {
        groups.paused.push(project);
      } else if (project.status === 'completed') {
        groups.completed.push(project);
      } else if (project.status === 'archived') {
        groups.archived.push(project);
      }
    });

    return groups;
  };

  const groupedProjects = groupProjectsByStatus();

  const toggleStatusFilter = (status: string) => {
    if (statusFilter.includes(status)) {
      setStatusFilter(statusFilter.filter(s => s !== status));
    } else {
      setStatusFilter([...statusFilter, status]);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600 mt-2">Manage your projects and time estimates</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} />
          New Project
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Filtros</h3>
        <div className="space-y-3">
          {/* Status Filter */}
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-2">Estado:</label>
            <div className="flex flex-wrap gap-2">
              {['active', 'paused', 'completed', 'archived'].map((status) => (
                <button
                  key={status}
                  onClick={() => toggleStatusFilter(status)}
                  className={`px-3 py-1.5 text-sm rounded transition-colors ${
                    statusFilter.includes(status)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {STATUS_LABELS[status]}
                </button>
              ))}
            </div>
          </div>

          {/* Deadline Filter */}
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-2">Deadline:</label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'all', label: 'Todos' },
                { value: 'overdue', label: '🔴 Atrasado' },
                { value: 'thisWeek', label: '🟡 Esta semana' },
                { value: 'upcoming', label: '🟡 Próximo' },
                { value: 'longTerm', label: '🟢 Con margen' },
                { value: 'noDeadline', label: 'Sin deadline' },
              ].map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setDeadlineFilter(filter.value)}
                  className={`px-3 py-1.5 text-sm rounded transition-colors ${
                    deadlineFilter === filter.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {/* Active Projects */}
        {groupedProjects.active.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-green-600 mb-4 flex items-center gap-2">
              <span className="bg-green-100 px-3 py-1 rounded-lg">Activos</span>
              <span className="text-sm text-gray-500">({groupedProjects.active.length})</span>
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {groupedProjects.active.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          </div>
        )}

        {/* Paused Projects */}
        {groupedProjects.paused.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-yellow-600 mb-4 flex items-center gap-2">
              <span className="bg-yellow-100 px-3 py-1 rounded-lg">Pausados</span>
              <span className="text-sm text-gray-500">({groupedProjects.paused.length})</span>
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {groupedProjects.paused.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          </div>
        )}

        {/* Completed Projects */}
        {groupedProjects.completed.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-blue-600 mb-4 flex items-center gap-2">
              <span className="bg-blue-100 px-3 py-1 rounded-lg">Completados</span>
              <span className="text-sm text-gray-500">({groupedProjects.completed.length})</span>
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {groupedProjects.completed.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          </div>
        )}

        {/* Archived Projects */}
        {groupedProjects.archived.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-600 mb-4 flex items-center gap-2">
              <span className="bg-gray-100 px-3 py-1 rounded-lg">Archivados</span>
              <span className="text-sm text-gray-500">({groupedProjects.archived.length})</span>
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {groupedProjects.archived.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          </div>
        )}
      </div>

      {filterProjects().length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No hay proyectos que coincidan con los filtros.</p>
          <p className="text-gray-400 mt-2">Ajusta los filtros o crea un nuevo proyecto.</p>
        </div>
      )}

      {projects.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No projects yet.</p>
          <p className="text-gray-400 mt-2">Create your first project to get started.</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {editingProject ? 'Edit Project' : 'New Project'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-full h-10 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value={1}>Low</option>
                    <option value={2}>Medium</option>
                    <option value={3}>High</option>
                    <option value={4}>Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as Project['status'] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="completed">Completed</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Est. Hours</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  placeholder="Ej: 10"
                  value={formData.estimatedHours}
                  onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                <p className="text-xs text-gray-500 mt-1">Horas totales estimadas para el proyecto</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  {formData.deadline && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, deadline: '' })}
                      className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center gap-1"
                      title="Eliminar deadline"
                    >
                      <X size={16} />
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingProject ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
