import { useState } from 'react';
import { Plus, Edit, Trash2, Clock } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useTauriCommands } from '../hooks/useTauriCommands';
import type { Project } from '../types';
import { getPriorityColor, getStatusColor } from '../utils/colors';
import { PRIORITY_LABELS, STATUS_LABELS } from '../types';

const Projects = () => {
  const { projects, addProject, updateProject, removeProject } = useStore();
  const tauri = useTauriCommands();
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3b82f6',
    priority: 2,
    status: 'active' as Project['status'],
    estimatedHours: '',
    hoursPerDay: '',
    hoursPerWeek: '',
    deadline: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const parseNumber = (value: string): number | undefined => {
        if (!value || value.trim() === '') return undefined;
        const parsed = parseFloat(value);
        return isNaN(parsed) ? undefined : parsed;
      };

      const data = {
        name: formData.name,
        description: formData.description || undefined,
        clientId: undefined,
        color: formData.color,
        priority: formData.priority,
        status: formData.status,
        estimatedHours: parseNumber(formData.estimatedHours),
        hoursPerDay: parseNumber(formData.hoursPerDay),
        hoursPerWeek: parseNumber(formData.hoursPerWeek),
        deadline: formData.deadline ? new Date(formData.deadline + 'T00:00:00Z').toISOString() : undefined,
      };

      console.log('Sending data:', data);

      if (editingProject) {
        const updated = await tauri.projects.update({ ...data, id: editingProject.id });
        updateProject(updated);
      } else {
        const created = await tauri.projects.create(data);
        addProject(created);
      }

      resetForm();
    } catch (error) {
      console.error('Error saving project:', error);
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
      hoursPerDay: project.hours_per_day?.toString() || '',
      hoursPerWeek: project.hours_per_week?.toString() || '',
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
      hoursPerDay: '',
      hoursPerWeek: '',
      deadline: '',
    });
    setEditingProject(null);
    setShowModal(false);
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

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {projects.map((project) => {
          return (
            <div key={project.id} className="bg-white rounded-lg border border-gray-200 p-6">
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
              </div>

              {project.estimated_hours && (
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                  <Clock size={16} />
                  <span>Est: {project.estimated_hours}h</span>
                </div>
              )}

              <div className="flex gap-2">
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
        })}
      </div>

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

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Est. Hours</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.estimatedHours}
                    onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hours/Day</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.hoursPerDay}
                    onChange={(e) => setFormData({ ...formData, hoursPerDay: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hours/Week</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.hoursPerWeek}
                    onChange={(e) => setFormData({ ...formData, hoursPerWeek: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
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
