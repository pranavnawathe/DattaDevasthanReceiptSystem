import { useState } from 'react';
import type { CreateRangeRequest } from '../types';

interface CreateRangeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateRangeRequest) => Promise<void>;
  loading?: boolean;
}

export function CreateRangeDialog({ isOpen, onClose, onSubmit, loading }: CreateRangeDialogProps) {
  const currentYear = new Date().getFullYear();
  const [formData, setFormData] = useState<CreateRangeRequest>({
    alias: '',
    year: currentYear,
    start: 1,
    end: 9999,
    suffix: '',
    createdBy: 'admin', // TODO: Get from auth context
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.alias.trim()) {
      newErrors.alias = 'Alias is required';
    }

    if (formData.year < 2000 || formData.year > 2100) {
      newErrors.year = 'Year must be between 2000 and 2100';
    }

    if (formData.start < 1) {
      newErrors.start = 'Start number must be at least 1';
    }

    if (formData.end > 99999) {
      newErrors.end = 'End number cannot exceed 99999 (5 digits)';
    }

    if (formData.start >= formData.end) {
      newErrors.end = 'End number must be greater than start number';
    }

    const rangeSize = formData.end - formData.start + 1;
    if (rangeSize < 10) {
      newErrors.end = 'Range must have at least 10 numbers';
    }

    if (formData.suffix && !/^[A-Z]$/.test(formData.suffix)) {
      newErrors.suffix = 'Suffix must be a single uppercase letter (A-Z)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
      // Reset form on success
      setFormData({
        alias: '',
        year: currentYear,
        start: 1,
        end: 9999,
        suffix: '',
        createdBy: 'admin',
      });
      setErrors({});
    } catch (error) {
      // Error handling is done in parent component
      console.error('Failed to create range:', error);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setErrors({});
      onClose();
    }
  };

  const calculateRangeSize = () => {
    return formData.end - formData.start + 1;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-900">Create New Range</h2>
          <p className="text-sm text-gray-500 mt-1">Add a new receipt number range</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {/* Alias */}
          <div>
            <label htmlFor="alias" className="block text-sm font-medium text-gray-700 mb-1">
              Alias / Book Name <span className="text-red-500">*</span>
            </label>
            <input
              id="alias"
              type="text"
              value={formData.alias}
              onChange={(e) => setFormData({ ...formData, alias: e.target.value })}
              placeholder="e.g., DIGI-2025-A or PHYS-BOOK-2025-01"
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
            {errors.alias && <p className="text-sm text-red-600 mt-1">{errors.alias}</p>}
          </div>

          {/* Year and Suffix */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
                Year <span className="text-red-500">*</span>
              </label>
              <input
                id="year"
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
              {errors.year && <p className="text-sm text-red-600 mt-1">{errors.year}</p>}
            </div>

            <div>
              <label htmlFor="suffix" className="block text-sm font-medium text-gray-700 mb-1">
                Suffix (A-Z)
              </label>
              <input
                id="suffix"
                type="text"
                value={formData.suffix}
                onChange={(e) => setFormData({ ...formData, suffix: e.target.value.toUpperCase() })}
                placeholder="A"
                maxLength={1}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 uppercase"
              />
              {errors.suffix && <p className="text-sm text-red-600 mt-1">{errors.suffix}</p>}
            </div>
          </div>

          {/* Start and End Numbers */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="start" className="block text-sm font-medium text-gray-700 mb-1">
                Start Number <span className="text-red-500">*</span>
              </label>
              <input
                id="start"
                type="number"
                value={formData.start}
                onChange={(e) => setFormData({ ...formData, start: parseInt(e.target.value) || 0 })}
                min="1"
                max="99999"
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
              {errors.start && <p className="text-sm text-red-600 mt-1">{errors.start}</p>}
            </div>

            <div>
              <label htmlFor="end" className="block text-sm font-medium text-gray-700 mb-1">
                End Number <span className="text-red-500">*</span>
              </label>
              <input
                id="end"
                type="number"
                value={formData.end}
                onChange={(e) => setFormData({ ...formData, end: parseInt(e.target.value) || 0 })}
                min="1"
                max="99999"
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
              {errors.end && <p className="text-sm text-red-600 mt-1">{errors.end}</p>}
            </div>
          </div>

          {/* Range Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm text-blue-900">
              <strong>Range ID:</strong> {formData.year}-{formData.suffix || 'A'}
            </p>
            <p className="text-sm text-blue-900 mt-1">
              <strong>Total Numbers:</strong> {calculateRangeSize().toLocaleString()}
            </p>
            <p className="text-sm text-blue-900 mt-1">
              <strong>First Receipt:</strong> {formData.year}-
              {formData.start.toString().padStart(5, '0')}
            </p>
            <p className="text-sm text-blue-900 mt-1">
              <strong>Last Receipt:</strong> {formData.year}-
              {formData.end.toString().padStart(5, '0')}
            </p>
          </div>
        </form>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex gap-3 justify-end">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Creating...' : 'Create Range'}
          </button>
        </div>
      </div>
    </div>
  );
}
