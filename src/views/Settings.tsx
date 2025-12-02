import { useState, useEffect } from 'react';
import { Download, FileText, Calendar, RefreshCw } from 'lucide-react';
import { useTauriCommands } from '../hooks/useTauriCommands';
import { save } from '@tauri-apps/plugin-dialog';
import { writeTextFile } from '@tauri-apps/plugin-fs';
import { check } from '@tauri-apps/plugin-updater';

const Settings = () => {
  const tauri = useTauriCommands();
  const [exportType, setExportType] = useState<'day' | 'month' | 'range'>('month');
  const [backupType, setBackupType] = useState<'day' | 'month' | 'range'>('month');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [backupStartDate, setBackupStartDate] = useState('');
  const [backupEndDate, setBackupEndDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);

  // Update states
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateVersion, setUpdateVersion] = useState('');
  const [updateBody, setUpdateBody] = useState('');
  const [installing, setInstalling] = useState(false);
  const [currentVersion] = useState('0.1.0'); // From tauri.conf.json

  useEffect(() => {
    // Set current month range as default for both PDF and Backup
    loadCurrentMonthRange();
  }, []);

  const loadCurrentMonthRange = async () => {
    try {
      const [start, end] = await tauri.export.getCurrentMonthRange();
      setStartDate(start);
      setEndDate(end);
      setBackupStartDate(start);
      setBackupEndDate(end);
    } catch (error) {
      console.error('Error loading month range:', error);
    }
  };

  const handleExportBackup = async () => {
    try {
      setLoading(true);
      let start = selectedDate;
      let end = selectedDate;
      let defaultName = `backup-${selectedDate}.json`;

      if (backupType === 'month') {
        start = backupStartDate;
        end = backupEndDate;
        const monthName = new Date(backupStartDate).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
        defaultName = `backup-${monthName.replace(' ', '-')}.json`;
      } else if (backupType === 'range') {
        start = backupStartDate;
        end = backupEndDate;
        defaultName = `backup-${start}-a-${end}.json`;
      }

      const filePath = await save({
        defaultPath: defaultName,
        filters: [{
          name: 'JSON',
          extensions: ['json']
        }]
      });

      if (filePath) {
        // Get all data for the range
        const [allSessions, allProjects, dailyStats] = await Promise.all([
          tauri.sessions.getAll(),
          tauri.projects.getAll(),
          tauri.stats.getDailyStats(start, end)
        ]);

        // Filter sessions for the date range
        const filteredSessions = allSessions.filter(session => {
          if (!session.start_time || !session.end_time) return false;
          const sessionDate = new Date(session.start_time).toISOString().split('T')[0];
          return sessionDate >= start && sessionDate <= end;
        });

        // Create backup data
        const backupData = {
          startDate: start,
          endDate: end,
          exportDate: new Date().toISOString(),
          sessions: filteredSessions,
          projects: allProjects,
          stats: dailyStats
        };

        // Save to file
        const jsonData = JSON.stringify(backupData, null, 2);
        await writeTextFile(filePath, jsonData);

        alert('Backup exportado exitosamente!');
      }
    } catch (error) {
      console.error('Error exporting backup:', error);
      alert(`Error al exportar backup: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setLoading(true);
      let start = selectedDate;
      let end = selectedDate;
      let defaultName = `reporte-${selectedDate}.pdf`;

      if (exportType === 'month') {
        start = startDate;
        end = endDate;
        const monthName = new Date(startDate).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
        defaultName = `reporte-${monthName.replace(' ', '-')}.pdf`;
      } else if (exportType === 'range') {
        start = startDate;
        end = endDate;
        defaultName = `reporte-${start}-a-${end}.pdf`;
      }

      const filePath = await save({
        defaultPath: defaultName,
        filters: [{
          name: 'PDF',
          extensions: ['pdf']
        }]
      });

      if (filePath) {
        await tauri.export.generatePdfReport(start, end, filePath);
        alert('PDF generado exitosamente!');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert(`Error al generar PDF: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const checkForUpdates = async () => {
    try {
      setCheckingUpdate(true);
      const update = await check();

      if (update) {
        setUpdateAvailable(true);
        setUpdateVersion(update.version);
        setUpdateBody(update.body || 'Sin información de cambios disponible');
      } else {
        alert('¡Estás usando la versión más reciente!');
        setUpdateAvailable(false);
      }
    } catch (error) {
      console.error('Error checking for updates:', error);
      alert(`Error al buscar actualizaciones: ${error}`);
    } finally {
      setCheckingUpdate(false);
    }
  };

  const installUpdate = async () => {
    try {
      setInstalling(true);
      const update = await check();

      if (update) {
        // Download and install the update (automatically relaunches the app)
        await update.downloadAndInstall();
      }
    } catch (error) {
      console.error('Error installing update:', error);
      alert(`Error al instalar actualización: ${error}`);
      setInstalling(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
        <p className="text-gray-600 mt-2">Actualizaciones, exportación de reportes y backups</p>
      </div>

      {/* Update Section - Full Width */}
      <div className="mb-6 bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <RefreshCw className="text-green-600" size={24} />
          <h2 className="text-xl font-semibold text-gray-900">Actualizaciones</h2>
        </div>
        <p className="text-gray-600 mb-4">
          Busca e instala actualizaciones de la aplicación
        </p>

        <div className="space-y-4">
          <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
            <div>
              <p className="text-sm font-medium text-gray-700">Versión actual</p>
              <p className="text-lg font-semibold text-gray-900">{currentVersion}</p>
            </div>
            {updateAvailable && (
              <div className="text-right">
                <p className="text-sm font-medium text-green-700">Nueva versión disponible</p>
                <p className="text-lg font-semibold text-green-600">{updateVersion}</p>
              </div>
            )}
          </div>

          {updateAvailable && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-medium text-green-900 mb-2">Cambios en esta versión:</h3>
              <div className="text-sm text-green-800 whitespace-pre-wrap">{updateBody}</div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={checkForUpdates}
              disabled={checkingUpdate || installing}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <RefreshCw size={18} className={checkingUpdate ? 'animate-spin' : ''} />
              {checkingUpdate ? 'Buscando...' : 'Buscar actualizaciones'}
            </button>

            {updateAvailable && (
              <button
                onClick={installUpdate}
                disabled={installing}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Download size={18} />
                {installing ? 'Instalando...' : 'Instalar actualización'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Backup Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Download className="text-blue-600" size={24} />
            <h2 className="text-xl font-semibold text-gray-900">Backup de Datos</h2>
          </div>
          <p className="text-gray-600 mb-4">
            Exporta todos los datos en formato JSON
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de backup
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setBackupType('day')}
                  className={`px-3 py-2 rounded-lg border transition-colors ${
                    backupType === 'day'
                      ? 'bg-blue-50 border-blue-600 text-blue-600'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Día
                </button>
                <button
                  onClick={() => {
                    setBackupType('month');
                    loadCurrentMonthRange();
                  }}
                  className={`px-3 py-2 rounded-lg border transition-colors ${
                    backupType === 'month'
                      ? 'bg-blue-50 border-blue-600 text-blue-600'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Mes
                </button>
                <button
                  onClick={() => setBackupType('range')}
                  className={`px-3 py-2 rounded-lg border transition-colors ${
                    backupType === 'range'
                      ? 'bg-blue-50 border-blue-600 text-blue-600'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Rango
                </button>
              </div>
            </div>

            {backupType === 'day' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {backupType === 'month' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-blue-700 text-sm">
                  <Calendar size={16} />
                  <span>
                    Mes actual: {new Date(backupStartDate).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                  </span>
                </div>
              </div>
            )}

            {backupType === 'range' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de inicio
                  </label>
                  <input
                    type="date"
                    value={backupStartDate}
                    onChange={(e) => setBackupStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de fin
                  </label>
                  <input
                    type="date"
                    value={backupEndDate}
                    onChange={(e) => setBackupEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            <button
              onClick={handleExportBackup}
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Download size={18} />
              {loading ? 'Exportando...' : 'Exportar Backup JSON'}
            </button>
          </div>
        </div>

        {/* PDF Export Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="text-red-600" size={24} />
            <h2 className="text-xl font-semibold text-gray-900">Reportes PDF</h2>
          </div>
          <p className="text-gray-600 mb-4">
            Genera un reporte PDF con las sesiones de tiempo
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de reporte
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setExportType('day')}
                  className={`px-3 py-2 rounded-lg border transition-colors ${
                    exportType === 'day'
                      ? 'bg-blue-50 border-blue-600 text-blue-600'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Día
                </button>
                <button
                  onClick={() => {
                    setExportType('month');
                    loadCurrentMonthRange();
                  }}
                  className={`px-3 py-2 rounded-lg border transition-colors ${
                    exportType === 'month'
                      ? 'bg-blue-50 border-blue-600 text-blue-600'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Mes
                </button>
                <button
                  onClick={() => setExportType('range')}
                  className={`px-3 py-2 rounded-lg border transition-colors ${
                    exportType === 'range'
                      ? 'bg-blue-50 border-blue-600 text-blue-600'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Rango
                </button>
              </div>
            </div>

            {exportType === 'day' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {exportType === 'month' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-blue-700 text-sm">
                  <Calendar size={16} />
                  <span>
                    Mes actual: {new Date(startDate).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                  </span>
                </div>
              </div>
            )}

            {exportType === 'range' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de inicio
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de fin
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            <button
              onClick={handleExportPDF}
              disabled={loading}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <FileText size={18} />
              {loading ? 'Generando...' : 'Generar PDF'}
            </button>
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="mt-6 bg-gray-50 rounded-lg border border-gray-200 p-4">
        <h3 className="font-medium text-gray-900 mb-2">Información</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• <strong>Actualizaciones:</strong> Busca nuevas versiones de la aplicación. Se descarga e instala automáticamente al confirmar</li>
          <li>• <strong>Backups JSON:</strong> Incluyen todas las sesiones, proyectos y estadísticas del período seleccionado</li>
          <li>• <strong>Reportes PDF:</strong> Incluyen un resumen visual de las horas trabajadas por proyecto</li>
          <li>• Puedes exportar datos de un día específico, mes actual o rango personalizado</li>
          <li>• Los archivos se guardan en la ubicación que elijas</li>
          <li>• Los backups son útiles para migrar datos o crear copias de seguridad</li>
        </ul>
      </div>
    </div>
  );
};

export default Settings;
