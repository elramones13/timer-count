import { useState, useEffect } from 'react';
import { Clock, TrendingUp, Target } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useTauriCommands } from '../hooks/useTauriCommands';
import type { Project, ProjectStats as ProjectStatsType } from '../types';

const Stats = () => {
  const { projects } = useStore();
  const tauri = useTauriCommands();
  const [projectsStats, setProjectsStats] = useState<ProjectStatsType[]>([]);

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

  const getProjectStats = (projectId: string): ProjectStatsType | undefined => {
    return projectsStats.find(stat => stat.project_id === projectId);
  };

  const getProgressColor = (percentage: number): string => {
    if (percentage < 25) return 'bg-red-500';
    if (percentage >= 26 && percentage <= 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getProgressTextColor = (percentage: number): string => {
    if (percentage < 25) return 'text-red-600';
    if (percentage >= 26 && percentage <= 50) return 'text-yellow-600';
    return 'text-green-600';
  };

  // Filter only projects with estimated hours, sorted alphabetically A-Z
  const projectsWithEstimates = projects
    .filter(p => p.estimated_hours && p.estimated_hours > 0)
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Estadísticas de Proyectos</h1>
        <p className="text-gray-600 mt-2">Seguimiento de horas trabajadas vs estimadas</p>
      </div>

      {projectsWithEstimates.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No hay proyectos con horas estimadas.</p>
          <p className="text-gray-400 mt-2">Añade horas estimadas a tus proyectos para ver las estadísticas.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {projectsWithEstimates.map((project) => {
            const stats = getProjectStats(project.id);
            const workedHours = stats?.total_hours || 0;
            const estimatedHours = project.estimated_hours || 0;
            const remainingHours = Math.max(estimatedHours - workedHours, 0);
            const percentage = estimatedHours > 0 ? (workedHours / estimatedHours) * 100 : 0;
            const isOverbudget = workedHours > estimatedHours;

            return (
              <div
                key={project.id}
                className="bg-white rounded-lg border-2 border-gray-200 p-6 hover:shadow-lg transition-shadow"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900">{project.name}</h3>
                    {project.description && (
                      <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                    )}
                  </div>
                  <div
                    className="w-6 h-6 rounded-full ml-4"
                    style={{ backgroundColor: project.color || '#3b82f6' }}
                  />
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-blue-600 mb-1">
                      <Clock size={16} />
                      <span className="text-xs font-medium">Trabajadas</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-700">
                      {workedHours.toFixed(1)}
                    </div>
                    <div className="text-xs text-blue-600">horas</div>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-purple-600 mb-1">
                      <Target size={16} />
                      <span className="text-xs font-medium">Estimadas</span>
                    </div>
                    <div className="text-2xl font-bold text-purple-700">
                      {estimatedHours.toFixed(1)}
                    </div>
                    <div className="text-xs text-purple-600">horas</div>
                  </div>

                  <div className={`${isOverbudget ? 'bg-red-50' : 'bg-green-50'} rounded-lg p-3`}>
                    <div className={`flex items-center gap-2 ${isOverbudget ? 'text-red-600' : 'text-green-600'} mb-1`}>
                      <TrendingUp size={16} />
                      <span className="text-xs font-medium">Restantes</span>
                    </div>
                    <div className={`text-2xl font-bold ${isOverbudget ? 'text-red-700' : 'text-green-700'}`}>
                      {isOverbudget ? '0.0' : remainingHours.toFixed(1)}
                    </div>
                    <div className={`text-xs ${isOverbudget ? 'text-red-600' : 'text-green-600'}`}>horas</div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Progreso</span>
                    <span className={`text-lg font-bold ${getProgressTextColor(Math.min(percentage, 100))}`}>
                      {Math.min(percentage, 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isOverbudget ? 'bg-red-500' : getProgressColor(percentage)
                      }`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Alert Messages */}
                {isOverbudget && (
                  <div className="bg-red-100 border border-red-300 text-red-800 px-4 py-3 rounded-lg text-sm">
                    <strong>⚠️ Sobre presupuesto:</strong> Has excedido por {(workedHours - estimatedHours).toFixed(1)} horas
                  </div>
                )}

                {!isOverbudget && percentage >= 80 && (
                  <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 px-4 py-3 rounded-lg text-sm">
                    <strong>⚡ Cerca del límite:</strong> Te quedan {remainingHours.toFixed(1)} horas
                  </div>
                )}

                {!isOverbudget && percentage < 50 && (
                  <div className="bg-green-100 border border-green-300 text-green-800 px-4 py-3 rounded-lg text-sm">
                    <strong>✓ Buen ritmo:</strong> Llevas {percentage.toFixed(1)}% completado
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Stats;
