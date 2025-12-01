import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTauriCommands } from '../hooks/useTauriCommands';
import type { DailyStats } from '../types';

const Calendar = () => {
  const tauri = useTauriCommands();
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'month' | 'year'>('month');

  useEffect(() => {
    loadData();
  }, [currentDate, viewMode]);

  const loadData = async () => {
    setLoading(true);
    try {
      let startDate: string;
      let endDate: string;

      if (viewMode === 'month') {
        const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        startDate = firstDay.toISOString().split('T')[0];
        endDate = lastDay.toISOString().split('T')[0];
      } else {
        const firstDay = new Date(currentDate.getFullYear(), 0, 1);
        const lastDay = new Date(currentDate.getFullYear(), 11, 31);
        startDate = firstDay.toISOString().split('T')[0];
        endDate = lastDay.toISOString().split('T')[0];
      }

      const stats = await tauri.stats.getDailyStats(startDate, endDate);
      setDailyStats(stats);
    } catch (error) {
      console.error('Error loading data:', error);
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

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const getMonthsInYear = (date: Date) => {
    const year = date.getFullYear();
    const months = [];
    for (let month = 0; month < 12; month++) {
      months.push(new Date(year, month, 1));
    }
    return months;
  };

  const getStatsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return dailyStats.find(s => s.date === dateStr);
  };

  const getStatsForMonth = (monthDate: Date) => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const monthStats = dailyStats.filter(s => {
      const statDate = new Date(s.date);
      return statDate.getFullYear() === year && statDate.getMonth() === month;
    });
    return monthStats.reduce((sum, stat) => sum + stat.total_hours, 0);
  };

  const navigatePrevious = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    } else {
      setCurrentDate(new Date(currentDate.getFullYear() - 1, 0, 1));
    }
  };

  const navigateNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    } else {
      setCurrentDate(new Date(currentDate.getFullYear() + 1, 0, 1));
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  const totalHours = dailyStats.reduce((sum, stat) => sum + stat.total_hours, 0);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Calendario</h1>
        <p className="text-gray-600 mt-2">Vista de tiempo registrado por día</p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={navigatePrevious}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <h2 className="text-xl font-semibold text-gray-900 min-w-[200px] text-center">
              {viewMode === 'month'
                ? `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`
                : currentDate.getFullYear()
              }
            </h2>
            <button
              onClick={navigateNext}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight size={20} />
            </button>
            <button
              onClick={goToToday}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium"
            >
              Hoy
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('month')}
                className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                  viewMode === 'month' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                }`}
              >
                Mes
              </button>
              <button
                onClick={() => setViewMode('year')}
                className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                  viewMode === 'year' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                }`}
              >
                Año
              </button>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Total {viewMode === 'month' ? 'del mes' : 'del año'}</div>
              <div className="text-2xl font-bold text-blue-600">{formatHours(totalHours)}</div>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Cargando datos...</p>
        </div>
      ) : viewMode === 'month' ? (
        /* Month View */
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-7 gap-px bg-gray-200">
            {dayNames.map((day) => (
              <div key={day} className="bg-gray-50 px-3 py-4 text-center text-sm font-semibold text-gray-700">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-px bg-gray-200">
            {getDaysInMonth(currentDate).map((day, index) => {
              if (!day) {
                return <div key={`empty-${index}`} className="bg-white min-h-[120px]" />;
              }

              const stats = getStatsForDate(day);
              const isToday = day.toDateString() === new Date().toDateString();
              const hasData = stats && stats.total_hours > 0;

              return (
                <div
                  key={day.toISOString()}
                  className={`bg-white min-h-[120px] p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                    isToday ? 'ring-2 ring-blue-500 ring-inset' : ''
                  }`}
                  onClick={() => {
                    const dateStr = day.toISOString().split('T')[0];
                    navigate(`/reports?date=${dateStr}`);
                  }}
                >
                  <div className="flex flex-col h-full">
                    <div className={`text-sm font-medium mb-2 ${
                      isToday ? 'text-blue-600' : 'text-gray-900'
                    }`}>
                      {day.getDate()}
                    </div>
                    {hasData && (
                      <div className="mt-auto">
                        <div className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-semibold text-center">
                          {formatHours(stats.total_hours)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Year View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {getMonthsInYear(currentDate).map((monthDate) => {
            const monthTotal = getStatsForMonth(monthDate);
            const hasData = monthTotal > 0;

            return (
              <div
                key={monthDate.toISOString()}
                className="bg-white rounded-lg border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => {
                  setCurrentDate(monthDate);
                  setViewMode('month');
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {monthNames[monthDate.getMonth()]}
                  </h3>
                  {hasData && (
                    <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-sm font-semibold">
                      {formatHours(monthTotal)}
                    </div>
                  )}
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  {hasData && (
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${Math.min((monthTotal / (totalHours || 1)) * 100, 100)}%` }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Calendar;
