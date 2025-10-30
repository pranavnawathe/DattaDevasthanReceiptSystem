import { useState, useEffect } from 'react';
import { useActiveRange } from '../contexts/ActiveRangeContext';
import type { RangeItem } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'https://lfg5incxn1.execute-api.ap-south-1.amazonaws.com';

interface RangeSelectionModalProps {
  onClose: () => void;
  onRangeSelected: () => void;
}

export function RangeSelectionModal({ onClose, onRangeSelected }: RangeSelectionModalProps) {
  const { setActiveRange } = useActiveRange();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [ranges, setRanges] = useState<RangeItem[]>([]);
  const [selectedRangeId, setSelectedRangeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1];

  // Fetch ranges for the selected year
  useEffect(() => {
    const fetchRanges = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_URL}/ranges?status=active&year=${selectedYear}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch ranges: ${response.status}`);
        }
        const data = await response.json();

        if (data.success) {
          setRanges(data.ranges || []);
        } else {
          throw new Error(data.message || 'Failed to fetch ranges');
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch ranges';
        setError(message);
        console.error('Error fetching ranges:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRanges();
  }, [selectedYear]);

  const handleConfirm = () => {
    if (!selectedRangeId) return;

    const selectedRange = ranges.find((r) => r.rangeId === selectedRangeId);
    if (selectedRange) {
      setConfirming(true);
      setActiveRange(selectedRange);
      setTimeout(() => {
        onRangeSelected();
      }, 300);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'locked':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'exhausted':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Select Active Range</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={confirming}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Year Filter */}
        <div className="px-6 py-4 border-b border-gray-200">
          <p className="text-sm font-medium text-gray-700 mb-3">Filter by Year:</p>
          <div className="flex gap-2">
            {years.map((year) => (
              <button
                key={year}
                onClick={() => setSelectedYear(year)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  selectedYear === year
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {year}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-sm text-gray-500">Loading ranges...</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* No Ranges Found */}
          {!loading && !error && ranges.length === 0 && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No active ranges found</h3>
              <p className="mt-1 text-sm text-gray-500">
                No active ranges are available for year {selectedYear}.
              </p>
            </div>
          )}

          {/* Range List */}
          {!loading && !error && ranges.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-4">
                Available Ranges for {selectedYear}:
              </p>

              <div className="space-y-3">
                {ranges.map((range) => {
                  const remaining = range.remaining ?? (range.end - range.next + 1);
                  const total = range.end - range.start + 1;
                  const usagePercent = ((range.next - range.start) / total) * 100;

                  return (
                    <label
                      key={range.rangeId}
                      className={`block p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedRangeId === range.rangeId
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start">
                        <input
                          type="radio"
                          name="range"
                          value={range.rangeId}
                          checked={selectedRangeId === range.rangeId}
                          onChange={() => setSelectedRangeId(range.rangeId)}
                          className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="ml-3 flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-semibold text-gray-900">{range.alias}</p>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusBadgeClass(range.status)}`}>
                              {range.status.toUpperCase()}
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-3 text-sm mb-2">
                            <div>
                              <p className="text-gray-500 text-xs">Next</p>
                              <p className="font-mono font-medium text-gray-900">
                                {range.year}-{range.next.toString().padStart(5, '0')}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500 text-xs">Remaining</p>
                              <p className={`font-medium ${remaining < 50 ? 'text-red-600' : 'text-gray-900'}`}>
                                {remaining}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500 text-xs">Total</p>
                              <p className="font-medium text-gray-900">{total}</p>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full transition-all ${
                                remaining < 50 ? 'bg-red-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${usagePercent}%` }}
                            />
                          </div>

                          {remaining < 50 && (
                            <p className="mt-2 text-xs text-red-600">⚠️ Low on numbers</p>
                          )}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Warning */}
        {!loading && ranges.length > 0 && (
          <div className="px-6 py-3 bg-yellow-50 border-t border-yellow-200">
            <p className="text-sm text-yellow-800">
              ⚠️ Numbers are monotonic per book. Switching will not renumber previously issued receipts.
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={confirming}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedRangeId || confirming}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {confirming ? 'Confirming...' : 'Confirm Selection'}
          </button>
        </div>
      </div>
    </div>
  );
}
