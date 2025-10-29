import { useState, useEffect } from 'react';
import type { RangeItem, RangeStatus, CreateRangeRequest } from '../types';
import { api } from '../services/api';
import { RangeCard } from './RangeCard';
import { CreateRangeDialog } from './CreateRangeDialog';

export function RangeManagement() {
  const [ranges, setRanges] = useState<RangeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<RangeStatus | 'all'>('all');
  const [filterYear, setFilterYear] = useState<number | 'all'>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Get unique years from ranges
  const availableYears = Array.from(new Set(ranges.map((r) => r.year))).sort((a, b) => b - a);

  const loadRanges = async () => {
    try {
      setLoading(true);
      setError(null);

      const filters: { status?: string; year?: number } = {};
      if (filterStatus !== 'all') filters.status = filterStatus;
      if (filterYear !== 'all') filters.year = filterYear;

      const response = await api.listRanges(filters);
      setRanges(response.ranges);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load ranges');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRanges();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus, filterYear]);

  const showNotification = (message: string, type: 'success' | 'error') => {
    if (type === 'success') {
      setSuccess(message);
      setTimeout(() => setSuccess(null), 5000);
    } else {
      setError(message);
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleCreateRange = async (data: CreateRangeRequest) => {
    try {
      setActionLoading('create');
      const response = await api.createRange(data);
      showNotification(response.message, 'success');
      setIsCreateDialogOpen(false);
      await loadRanges();
    } catch (err) {
      showNotification(err instanceof Error ? err.message : 'Failed to create range', 'error');
      throw err; // Re-throw to prevent dialog from closing
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateStatus = async (rangeId: string, action: 'activate' | 'lock' | 'unlock' | 'archive') => {
    try {
      setActionLoading(rangeId);
      const response = await api.updateRangeStatus(rangeId, {
        action,
        userId: 'admin', // TODO: Get from auth context
      });
      showNotification(response.message, 'success');
      await loadRanges();
    } catch (err) {
      showNotification(err instanceof Error ? err.message : `Failed to ${action} range`, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredRanges = ranges.filter((range) => {
    if (filterStatus !== 'all' && range.status !== filterStatus) return false;
    if (filterYear !== 'all' && range.year !== filterYear) return false;
    return true;
  });

  // Group ranges by status for better organization
  const groupedRanges = {
    active: filteredRanges.filter((r) => r.status === 'active'),
    draft: filteredRanges.filter((r) => r.status === 'draft'),
    locked: filteredRanges.filter((r) => r.status === 'locked'),
    exhausted: filteredRanges.filter((r) => r.status === 'exhausted'),
    archived: filteredRanges.filter((r) => r.status === 'archived'),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Range Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage receipt number ranges</p>
        </div>
        <button
          onClick={() => setIsCreateDialogOpen(true)}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
        >
          + Create New Range
        </button>
      </div>

      {/* Notifications */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-start gap-3">
          <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <p className="text-sm flex-1">{success}</p>
          <button onClick={() => setSuccess(null)} className="text-green-600 hover:text-green-800">
            ×
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-start gap-3">
          <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <p className="text-sm flex-1">{error}</p>
          <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
            ×
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Status
            </label>
            <select
              id="status-filter"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as RangeStatus | 'all')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="locked">Locked</option>
              <option value="exhausted">Exhausted</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="flex-1">
            <label htmlFor="year-filter" className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Year
            </label>
            <select
              id="year-filter"
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Years</option>
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-gray-500 mt-4">Loading ranges...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredRanges.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <svg
            className="w-12 h-12 text-gray-400 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No ranges found</h3>
          <p className="text-sm text-gray-500 mb-4">
            {filterStatus !== 'all' || filterYear !== 'all'
              ? 'Try adjusting your filters'
              : 'Get started by creating a new range'}
          </p>
          {filterStatus === 'all' && filterYear === 'all' && (
            <button
              onClick={() => setIsCreateDialogOpen(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Create First Range
            </button>
          )}
        </div>
      )}

      {/* Ranges Grid - Grouped by Status */}
      {!loading && filteredRanges.length > 0 && (
        <div className="space-y-6">
          {/* Active Ranges */}
          {groupedRanges.active.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                Active Ranges ({groupedRanges.active.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedRanges.active.map((range) => (
                  <RangeCard
                    key={range.rangeId}
                    range={range}
                    onLock={(id) => handleUpdateStatus(id, 'lock')}
                    loading={actionLoading === range.rangeId}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Draft Ranges */}
          {groupedRanges.draft.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                Draft Ranges ({groupedRanges.draft.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedRanges.draft.map((range) => (
                  <RangeCard
                    key={range.rangeId}
                    range={range}
                    onActivate={(id) => handleUpdateStatus(id, 'activate')}
                    loading={actionLoading === range.rangeId}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Locked Ranges */}
          {groupedRanges.locked.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                Locked Ranges ({groupedRanges.locked.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedRanges.locked.map((range) => (
                  <RangeCard
                    key={range.rangeId}
                    range={range}
                    onUnlock={(id) => handleUpdateStatus(id, 'unlock')}
                    onArchive={(id) => handleUpdateStatus(id, 'archive')}
                    loading={actionLoading === range.rangeId}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Exhausted Ranges */}
          {groupedRanges.exhausted.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                Exhausted Ranges ({groupedRanges.exhausted.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedRanges.exhausted.map((range) => (
                  <RangeCard
                    key={range.rangeId}
                    range={range}
                    onArchive={(id) => handleUpdateStatus(id, 'archive')}
                    loading={actionLoading === range.rangeId}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Archived Ranges */}
          {groupedRanges.archived.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                Archived Ranges ({groupedRanges.archived.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedRanges.archived.map((range) => (
                  <RangeCard key={range.rangeId} range={range} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Range Dialog */}
      <CreateRangeDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSubmit={handleCreateRange}
        loading={actionLoading === 'create'}
      />
    </div>
  );
}
