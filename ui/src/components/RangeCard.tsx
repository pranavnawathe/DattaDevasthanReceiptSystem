import type { RangeItem } from '../types';

interface RangeCardProps {
  range: RangeItem;
  onActivate?: (rangeId: string) => void;
  onLock?: (rangeId: string) => void;
  onUnlock?: (rangeId: string) => void;
  onArchive?: (rangeId: string) => void;
  loading?: boolean;
}

export function RangeCard({ range, onActivate, onLock, onUnlock, onArchive, loading }: RangeCardProps) {
  const { rangeId, alias, year, start, end, next, status, remaining, createdAt, updatedAt, lockedBy } = range;

  // Status badge styling
  const statusStyles = {
    draft: 'bg-gray-100 text-gray-800 border-gray-300',
    active: 'bg-green-100 text-green-800 border-green-300',
    locked: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    exhausted: 'bg-red-100 text-red-800 border-red-300',
    archived: 'bg-purple-100 text-purple-800 border-purple-300',
  };

  const getProgressPercentage = () => {
    const total = end - start + 1;
    const used = next - start;
    return (used / total) * 100;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const canActivate = status === 'draft';
  const canLock = status === 'active';
  const canUnlock = status === 'locked';
  const canArchive = status === 'locked' || status === 'exhausted';

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{alias}</h3>
          <p className="text-sm text-gray-500">Range ID: {rangeId}</p>
        </div>
        <span
          className={`px-3 py-1 text-xs font-medium rounded-full border ${statusStyles[status]}`}
        >
          {status.toUpperCase()}
        </span>
      </div>

      {/* Range Details */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-500 mb-1">Year</p>
          <p className="text-sm font-medium text-gray-900">{year}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Range</p>
          <p className="text-sm font-medium text-gray-900">
            {start.toString().padStart(5, '0')} - {end.toString().padStart(5, '0')}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Next Number</p>
          <p className="text-sm font-medium text-gray-900">
            {year}-{next.toString().padStart(5, '0')}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Remaining</p>
          <p className="text-sm font-medium text-gray-900">
            {remaining ?? end - next + 1} / {end - start + 1}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Usage</span>
          <span>{getProgressPercentage().toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              status === 'exhausted'
                ? 'bg-red-500'
                : status === 'active'
                ? 'bg-green-500'
                : 'bg-gray-400'
            }`}
            style={{ width: `${getProgressPercentage()}%` }}
          />
        </div>
      </div>

      {/* Metadata */}
      <div className="border-t border-gray-100 pt-3 mb-4">
        <div className="text-xs text-gray-500 space-y-1">
          <p>Created: {formatDate(createdAt)}</p>
          {updatedAt && <p>Updated: {formatDate(updatedAt)}</p>}
          {lockedBy && <p>Locked by: {lockedBy}</p>}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 flex-wrap">
        {canActivate && onActivate && (
          <button
            onClick={() => onActivate(rangeId)}
            disabled={loading}
            className="px-3 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded transition-colors"
          >
            {loading ? 'Activating...' : 'Activate'}
          </button>
        )}
        {canLock && onLock && (
          <button
            onClick={() => onLock(rangeId)}
            disabled={loading}
            className="px-3 py-1.5 text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded transition-colors"
          >
            {loading ? 'Locking...' : 'Lock'}
          </button>
        )}
        {canUnlock && onUnlock && (
          <button
            onClick={() => onUnlock(rangeId)}
            disabled={loading}
            className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded transition-colors"
          >
            {loading ? 'Unlocking...' : 'Unlock'}
          </button>
        )}
        {canArchive && onArchive && (
          <button
            onClick={() => onArchive(rangeId)}
            disabled={loading}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed rounded transition-colors"
          >
            {loading ? 'Archiving...' : 'Archive'}
          </button>
        )}
      </div>
    </div>
  );
}
