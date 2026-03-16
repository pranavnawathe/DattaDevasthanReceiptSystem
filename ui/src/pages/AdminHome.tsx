import { TempleHeader } from '../components/TempleHeader';

export function AdminHome() {
  const handleNavigate = (path: string) => {
    if (path === '/') {
      window.location.hash = '#receipts';
    } else {
      window.location.href = path;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <TempleHeader
        title="प्रशासक मुखपृष्ठ / Admin Home"
        subtitle="Receipt Management System"
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 marathi">द्रुत क्रिया / Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Issue Receipt */}
            <button
              onClick={() => handleNavigate('/')}
              className="p-6 bg-white border-2 border-blue-200 rounded-lg hover:border-blue-400 hover:shadow-md text-left transition-all"
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

            {/* Export */}
            <button
              onClick={() => window.location.hash = '#export'}
              className="p-6 bg-white border-2 border-purple-200 rounded-lg hover:border-purple-400 hover:shadow-md text-left transition-all"
            >
              <div className="flex items-center mb-3">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-semibold text-gray-900 marathi">निर्यात करा</h3>
                  <p className="text-xs text-gray-600">Export</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 marathi">टॅली साठी डेटा निर्यात करा</p>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
