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
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
            {project.description && (
              <p className="text-sm text-gray-500 mt-1">{project.description}</p>
            )}
          </div>
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: project.color || '#3b82f6' }}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-2xl font-mono font-bold text-gray-900">
            <Clock size={24} />
            <span>{formatDuration(elapsed)}</span>
          </div>

          <div className="flex gap-2">
            {!isRunning ? (
              <button
                onClick={onStart}
                className="p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                title="Start timer"
              >
                <Play size={20} />
              </button>
            ) : (
              <>
                <button
                  onClick={() => setShowNotes(!showNotes)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  title="Stop and add notes"
                >
                  <Square size={20} />
                </button>
              </>
            )}
          </div>
        </div>

        {showNotes && isRunning && (
          <div className="mt-4 space-y-3">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this session (optional)..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
            <div className="flex gap-2">
              <button
                onClick={handleStop}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Stop & Save
              </button>
              <button
                onClick={() => {
                  setShowNotes(false);
                  setNotes('');
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
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
