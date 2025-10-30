import React, { useState } from 'react';

const API_URL = 'https://lfg5incxn1.execute-api.ap-south-1.amazonaws.com';

interface ExportRequest {
  format: 'csv' | 'excel';
  startDate: string;
  endDate: string;
  rangeId?: string;
  includeVoided?: boolean;
}

interface ExportResponse {
  success: boolean;
  format: 'csv' | 'excel';
  fileName: string;
  content: string;
  recordCount: number;
  dateRange: {
    start: string;
    end: string;
  };
}

export function ExportData() {
  const [format, setFormat] = useState<'csv' | 'excel'>('csv');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [rangeId, setRangeId] = useState('');
  const [includeVoided, setIncludeVoided] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Validate dates
      if (!startDate || !endDate) {
        setError('कृपया प्रारंभ आणि समाप्ती तारीख निवडा / Please select start and end dates');
        setLoading(false);
        return;
      }

      const start = new Date(startDate);
      const end = new Date(endDate);

      if (start > end) {
        setError('प्रारंभ तारीख समाप्ती तारखेपूर्वी असावी / Start date must be before end date');
        setLoading(false);
        return;
      }

      // Build export request
      const exportRequest: ExportRequest = {
        format,
        startDate,
        endDate,
        includeVoided,
      };

      if (rangeId.trim()) {
        exportRequest.rangeId = rangeId.trim();
      }

      // Call export API
      const response = await fetch(`${API_URL}/receipts/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(exportRequest),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Export failed');
      }

      const result: ExportResponse = await response.json();

      if (!result.success) {
        throw new Error('Export failed');
      }

      // Trigger download
      downloadFile(result.fileName, result.content, result.format);

      setSuccess(
        `यशस्वीरित्या निर्यात केले! ${result.recordCount} नोंदी / Successfully exported ${result.recordCount} records`
      );
    } catch (err) {
      console.error('Export error:', err);
      setError(err instanceof Error ? err.message : 'निर्यात अयशस्वी / Export failed');
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = (fileName: string, content: string, format: 'csv' | 'excel') => {
    const mimeType = format === 'csv' ? 'text/csv;charset=utf-8;' : 'application/vnd.ms-excel';
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const getFirstDayOfMonth = () => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  };

  const setDateRangePreset = (preset: 'today' | 'thisMonth' | 'lastMonth' | 'thisYear') => {
    const today = new Date();

    switch (preset) {
      case 'today':
        setStartDate(getTodayDate());
        setEndDate(getTodayDate());
        break;

      case 'thisMonth':
        setStartDate(getFirstDayOfMonth());
        setEndDate(getTodayDate());
        break;

      case 'lastMonth': {
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
        setStartDate(lastMonth.toISOString().split('T')[0]);
        setEndDate(lastMonthEnd.toISOString().split('T')[0]);
        break;
      }

      case 'thisYear': {
        const yearStart = new Date(today.getFullYear(), 0, 1);
        setStartDate(yearStart.toISOString().split('T')[0]);
        setEndDate(getTodayDate());
        break;
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-6">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-6">
        <button
          onClick={() => (window.location.hash = '#home')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          मागे जा / Back
        </button>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <svg className="h-8 w-8 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 marathi">डेटा निर्यात / Data Export</h1>
              <p className="text-sm text-gray-600 marathi">Tally साठी CSV निर्यात करा / Export CSV for Tally</p>
            </div>
          </div>
        </div>
      </div>

      {/* Export Form */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleExport}>
            {/* Format Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2 marathi">
                निर्यात स्वरूप / Export Format
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="format"
                    value="csv"
                    checked={format === 'csv'}
                    onChange={(e) => setFormat(e.target.value as 'csv')}
                    className="mr-2"
                  />
                  <span className="text-sm">CSV (Tally/Excel)</span>
                </label>
                <label className="flex items-center opacity-50 cursor-not-allowed">
                  <input type="radio" name="format" value="excel" disabled className="mr-2" />
                  <span className="text-sm">Excel (लवकरच / Coming Soon)</span>
                </label>
              </div>
            </div>

            {/* Date Range Presets */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2 marathi">
                द्रुत निवड / Quick Select
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setDateRangePreset('today')}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                >
                  आज / Today
                </button>
                <button
                  type="button"
                  onClick={() => setDateRangePreset('thisMonth')}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                >
                  हा महिना / This Month
                </button>
                <button
                  type="button"
                  onClick={() => setDateRangePreset('lastMonth')}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                >
                  मागील महिना / Last Month
                </button>
                <button
                  type="button"
                  onClick={() => setDateRangePreset('thisYear')}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                >
                  हे वर्ष / This Year
                </button>
              </div>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2 marathi">
                  प्रारंभ तारीख / Start Date *
                </label>
                <input
                  type="date"
                  id="startDate"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2 marathi">
                  समाप्ती तारीख / End Date *
                </label>
                <input
                  type="date"
                  id="endDate"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            {/* Range Filter (Optional) */}
            <div className="mb-6">
              <label htmlFor="rangeId" className="block text-sm font-medium text-gray-700 mb-2 marathi">
                श्रेणी फिल्टर / Range Filter (पर्यायी / Optional)
              </label>
              <input
                type="text"
                id="rangeId"
                value={rangeId}
                onChange={(e) => setRangeId(e.target.value)}
                placeholder="उदा. / e.g. 2025-A"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1 marathi">
                विशिष्ट श्रेणीची पावत्या निर्यात करण्यासाठी / To export receipts from a specific range
              </p>
            </div>

            {/* Include Voided */}
            <div className="mb-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={includeVoided}
                  onChange={(e) => setIncludeVoided(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700 marathi">
                  रद्द केलेल्या पावत्या समाविष्ट करा / Include voided receipts
                </span>
              </label>
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800 marathi">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-800 marathi">{success}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold marathi"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 inline mr-2" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    निर्यात करत आहे... / Exporting...
                  </>
                ) : (
                  <>
                    <svg className="h-5 w-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    निर्यात करा / Export
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Info Section */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h3 className="text-sm font-semibold text-blue-900 mb-2 marathi">CSV स्वरूप माहिती / CSV Format Info</h3>
            <ul className="text-xs text-blue-800 space-y-1 marathi">
              <li>• निर्यात केलेली फाईल Tally मध्ये आयात करण्यासाठी तयार आहे / Export file is ready for Tally import</li>
              <li>
                • स्तंभ: तारीख, पावती क्र., दात्याचे नाव, मोबाइल, PAN, रक्कम, पेमेंट मोड / Columns: Date, Receipt No, Donor
                Name, Mobile, PAN, Amount, Payment Mode
              </li>
              <li>• कमाल १ वर्षाची श्रेणी निर्यात करता येईल / Maximum 1 year date range can be exported</li>
              <li>• CSV फाईल स्वयंचलितपणे डाउनलोड होईल / CSV file will download automatically</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
