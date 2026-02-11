import { useState, useEffect } from 'react';
import { Play, Square, Clock } from 'lucide-react';
import type { Project, TimeSession } from '../types';
import { formatDuration } from '../utils/formatTime';

interface TimerCardProps {
  project: Project;
  session?: TimeSession;
  onStart: () => void;
  onStop: (notes?: string) => void;
}

const TimerCard = ({ project, session, onStart, onStop }: TimerCardProps) => {
  const [elapsed, setElapsed] = useState(0);
  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);

  useEffect(() => {
    if (session?.is_running) {
      const startTime = new Date(session.start_time).getTime();

      const updateElapsed = () => {
        const now = Date.now();
        setElapsed(Math.floor((now - startTime) / 1000));
      };

      updateElapsed();
      const interval = setInterval(updateElapsed, 1000);

      return () => clearInterval(interval);
    } else {
      setElapsed(0);
    }
  }, [session]);

  const handleStop = () => {
    onStop(notes || undefined);
    setNotes('');
    setShowNotes(false);
  };

  const isRunning = session?.is_running || false;

  return (
    <div
      className="bg-white rounded-lg border-2 transition-all"
      style={{
        borderColor: isRunning ? project.color || '#3b82f6' : '#e5e7eb',
      }}
    >
      <div className="p-3">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 truncate">{project.name}</h3>
            {project.description && (
              <p className="text-xs text-gray-500 mt-0.5 truncate">{project.description}</p>
            )}
          </div>
          <div
            className="w-2.5 h-2.5 rounded-full ml-2 mt-0.5 flex-shrink-0"
            style={{ backgroundColor: project.color || '#3b82f6' }}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-base font-mono font-bold text-gray-900">
            <Clock size={16} />
            <span>{formatDuration(elapsed)}</span>
          </div>

          <div className="flex gap-1.5">
            {!isRunning ? (
              <button
                onClick={onStart}
                className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                title="Start timer"
              >
                <Play size={16} />
              </button>
            ) : (
              <>
                <button
                  onClick={() => setShowNotes(!showNotes)}
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  title="Stop and add notes"
                >
                  <Square size={16} />
                </button>
              </>
            )}
          </div>
        </div>

        {showNotes && isRunning && (
          <div className="mt-3 space-y-2">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this session (optional)..."
              className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              rows={2}
            />
            <div className="flex gap-1.5">
              <button
                onClick={handleStop}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Stop & Save
              </button>
              <button
                onClick={() => {
                  setShowNotes(false);
                  setNotes('');
                }}
                className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimerCard;
