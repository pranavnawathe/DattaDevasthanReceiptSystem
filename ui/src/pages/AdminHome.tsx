import { useState, useEffect } from 'react';
import { useActiveRange } from '../contexts/ActiveRangeContext';
import { RangeSelectionModal } from '../components/RangeSelectionModal';

export function AdminHome() {
  const { activeRange, loading, error, refreshActiveRange } = useActiveRange();
  const [showRangeModal, setShowRangeModal] = useState(false);

  // Refresh active range on mount
  useEffect(() => {
    refreshActiveRange();
  }, []);

  const handleSwitchRange = () => {
    setShowRangeModal(true);
  };

  const handleRangeSelected = () => {
    setShowRangeModal(false);
    refreshActiveRange();
  };

  const handleNavigate = (path: string) => {
    if (path === '/') {
      window.location.hash = '#receipts';
    } else {
      window.location.href = path;
    }
  };

  const getProgressPercentage = () => {
    if (!activeRange) return 0;
    const total = activeRange.end - activeRange.start + 1;
    const used = activeRange.next - activeRange.start;
    return (used / total) * 100;
  };

  const getRemainingCount = () => {
    if (!activeRange) return 0;
    return activeRange.remaining ?? (activeRange.end - activeRange.next + 1);
  };

  const isLowOnNumbers = () => {
    return getRemainingCount() < 50;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900 marathi">श्री दत्त देवस्थान</h1>
              <p className="text-sm text-gray-500">Datta Devasthan, Sakharpa</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-700">Branch: Main</p>
                <p className="text-xs text-gray-500">User: Admin</p>
              </div>
              <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 border border-blue-300">
                ADMIN
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading active range</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && !activeRange && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-sm text-gray-500">Loading active range...</p>
          </div>
        )}

        {/* No Active Range Warning */}
        {!loading && !activeRange && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <svg className="mx-auto h-12 w-12 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-yellow-900 marathi">कोणतीही सक्रिय श्रेणी निवडलेली नाही</h3>
            <p className="mt-1 text-sm text-yellow-700 marathi">
              पावती देण्यासाठी सक्रिय श्रेणी निवडा.
            </p>
            <button
              onClick={handleSwitchRange}
              className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium marathi"
            >
              श्रेणी निवडा / Select Range
            </button>
          </div>
        )}

        {/* Active Range Card */}
        {activeRange && (
          <div className="mb-6 bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 marathi">सक्रिय श्रेणी / Active Range</h2>
                <p className="text-sm text-gray-500 marathi">सध्याची पावती पुस्तक</p>
              </div>
              <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 border border-green-300">
                {activeRange.status.toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-500 mb-1 marathi">उपनाम / Alias</p>
                <p className="text-base font-semibold text-gray-900">{activeRange.alias}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1 marathi">वर्ष / Year</p>
                <p className="text-base font-semibold text-gray-900">{activeRange.year}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1 marathi">पुढील क्रमांक / Next</p>
                <p className="text-base font-mono font-semibold text-blue-600">
                  {activeRange.year}-{activeRange.next.toString().padStart(5, '0')}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1 marathi">शिल्लक / Remaining</p>
                <p className={`text-base font-semibold ${isLowOnNumbers() ? 'text-red-600' : 'text-gray-900'}`}>
                  {getRemainingCount()} / {activeRange.end - activeRange.start + 1}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span className="marathi">वापर / Usage</span>
                <span>{getProgressPercentage().toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    isLowOnNumbers() ? 'bg-red-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${getProgressPercentage()}%` }}
                />
              </div>
            </div>

            {/* Low Numbers Warning */}
            {isLowOnNumbers() && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded p-3">
                <p className="text-sm text-red-800 marathi">
                  ⚠️ इशारा: फक्त {getRemainingCount()} क्रमांक शिल्लक आहेत. कृपया लवकरच नवीन श्रेणी सक्रिय करा.
                </p>
              </div>
            )}

            {/* Note */}
            <p className="text-xs text-gray-500 mb-4 marathi">
              नोंद: पावती क्रमांक श्रेणीनुसार दिले जातात आणि पुन्हा वापरले जाऊ शकत नाहीत.
            </p>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={handleSwitchRange}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors marathi"
              >
                श्रेणी बदला / Switch Range
              </button>
              <button
                disabled
                className="px-4 py-2 text-sm font-medium text-gray-400 bg-gray-100 border border-gray-200 rounded-lg cursor-not-allowed marathi"
                title="लवकरच येत आहे"
              >
                लॉक करा / Lock
              </button>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 marathi">द्रुत क्रिया / Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Issue Receipt */}
            <button
              onClick={() => handleNavigate('/')}
              disabled={!activeRange}
              className={`p-6 rounded-lg border-2 text-left transition-all ${
                activeRange
                  ? 'bg-white border-blue-200 hover:border-blue-400 hover:shadow-md'
                  : 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-60'
              }`}
            >
              <div className="flex items-center mb-3">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-semibold text-gray-900 marathi">पावती तयार करा</h3>
                  <p className="text-xs text-gray-600">Issue Receipt</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 marathi">नवीन देणगी पावती तयार करा</p>
              {!activeRange && (
                <p className="mt-2 text-xs text-red-600 marathi">⚠️ प्रथम श्रेणी निवडा</p>
              )}
            </button>

            {/* Donor Search */}
            <button
              onClick={() => window.location.hash = '#donors'}
              className="p-6 bg-white border-2 border-green-200 rounded-lg hover:border-green-400 hover:shadow-md text-left transition-all"
            >
              <div className="flex items-center mb-3">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-semibold text-gray-900 marathi">दात्यांचा शोध</h3>
                  <p className="text-xs text-gray-600">Donor Search</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 marathi">दाते शोधा आणि इतिहास पहा</p>
            </button>

            {/* Donation Export */}
            <button
              disabled
              className="p-6 bg-gray-50 border-2 border-gray-200 rounded-lg text-left cursor-not-allowed opacity-60"
              title="लवकरच येत आहे"
            >
              <div className="flex items-center mb-3">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-semibold text-gray-400 marathi">निर्यात करा</h3>
                  <p className="text-xs text-gray-500">Export</p>
                </div>
              </div>
              <p className="text-sm text-gray-500 marathi">टॅली साठी डेटा निर्यात करा</p>
              <p className="mt-2 text-xs text-gray-400 marathi">लवकरच येत आहे</p>
            </button>

            {/* Range Manager */}
            <button
              onClick={() => window.location.hash = '#ranges'}
              className="p-6 bg-white border-2 border-purple-200 rounded-lg hover:border-purple-400 hover:shadow-md text-left transition-all"
            >
              <div className="flex items-center mb-3">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-semibold text-gray-900 marathi">श्रेणी व्यवस्थापन</h3>
                  <p className="text-xs text-gray-600">Range Manager</p>
                </div>
                <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded bg-purple-100 text-purple-800 marathi">प्रशासक</span>
              </div>
              <p className="text-sm text-gray-600 marathi">पावती क्रमांक श्रेणी व्यवस्थापित करा</p>
            </button>

            {/* System Health */}
            <button
              disabled
              className="p-6 bg-gray-50 border-2 border-gray-200 rounded-lg text-left cursor-not-allowed opacity-60"
              title="लवकरच येत आहे"
            >
              <div className="flex items-center mb-3">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-semibold text-gray-400 marathi">प्रणाली आरोग्य</h3>
                  <p className="text-xs text-gray-500">System Health</p>
                </div>
              </div>
              <p className="text-sm text-gray-500 marathi">प्रणाली स्थिती आणि कार्यक्षमता पहा</p>
              <p className="mt-2 text-xs text-gray-400 marathi">लवकरच येत आहे</p>
            </button>
          </div>
        </div>

        {/* Range Health Widget */}
        {activeRange && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 marathi">श्रेणी आरोग्य / Range Health</h2>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-3 ${isLowOnNumbers() ? 'bg-red-500' : 'bg-green-500'}`}></div>
                  <span className="text-sm font-medium text-gray-700">{activeRange.alias}</span>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${isLowOnNumbers() ? 'text-red-600' : 'text-gray-900'}`}>
                    <span className="marathi">शिल्लक:</span> {getRemainingCount()}
                  </p>
                  <p className="text-xs text-gray-500 marathi">
                    मर्यादा: 50
                  </p>
                </div>
              </div>

              {isLowOnNumbers() && (
                <div className="bg-red-50 border border-red-200 rounded p-3">
                  <p className="text-sm text-red-800 font-medium marathi">⚠️ इशारा: श्रेणी जवळजवळ संपली</p>
                  <p className="text-xs text-red-600 mt-1 marathi">
                    सतत पावती देण्यासाठी कृपया नवीन श्रेणी सक्रिय करा.
                  </p>
                </div>
              )}

              {!isLowOnNumbers() && (
                <div className="bg-green-50 border border-green-200 rounded p-3">
                  <p className="text-sm text-green-800 marathi">✅ कोणतेही इशारे नाहीत - श्रेणी चांगली आहे</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Range Selection Modal */}
      {showRangeModal && (
        <RangeSelectionModal
          onClose={() => setShowRangeModal(false)}
          onRangeSelected={handleRangeSelected}
        />
      )}
    </div>
  );
}
