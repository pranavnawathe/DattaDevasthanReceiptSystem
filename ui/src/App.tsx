import { useState, useEffect } from 'react';
import type { CreateReceiptResponse } from './types';
import { Header } from './components/Header';
import { DonationForm } from './components/DonationForm';
import { ReceiptDisplay } from './components/ReceiptDisplay';
import { RangeManagement } from './components/RangeManagement';
import { AdminHome } from './pages/AdminHome';
import { useActiveRange } from './contexts/ActiveRangeContext';

type Route = 'home' | 'receipts' | 'ranges';

function App() {
  const [currentRoute, setCurrentRoute] = useState<Route>('home');
  const [receipt, setReceipt] = useState<CreateReceiptResponse | null>(null);
  const { activeRange } = useActiveRange();

  // Handle hash-based routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1); // Remove '#'
      if (hash === 'ranges') {
        setCurrentRoute('ranges');
      } else if (hash === 'receipts' || hash === 'issue') {
        setCurrentRoute('receipts');
      } else {
        setCurrentRoute('home');
      }
    };

    // Set initial route
    handleHashChange();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleSuccess = (newReceipt: CreateReceiptResponse) => {
    setReceipt(newReceipt);
    // Scroll to top to show success message
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCreateAnother = () => {
    setReceipt(null);
    // Scroll to top to show form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateTo = (route: Route) => {
    if (route === 'home') {
      window.location.hash = '';
    } else {
      window.location.hash = route;
    }
  };

  // Route guard: Redirect to home if trying to access receipts without active range
  useEffect(() => {
    if (currentRoute === 'receipts' && !activeRange) {
      navigateTo('home');
    }
  }, [currentRoute, activeRange]);

  // Render home page
  if (currentRoute === 'home') {
    return <AdminHome />;
  }

  // Render other routes (receipts or ranges)
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => navigateTo('home')}
              className="py-4 px-1 border-b-2 font-medium text-sm transition-colors border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            >
              Home
            </button>
            <button
              onClick={() => navigateTo('receipts')}
              disabled={!activeRange}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                currentRoute === 'receipts'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              Receipt Entry
              {!activeRange && <span className="ml-1 text-xs">🔒</span>}
            </button>
            <button
              onClick={() => navigateTo('ranges')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                currentRoute === 'ranges'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Range Management
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {currentRoute === 'receipts' ? (
          <div className="max-w-4xl mx-auto">
            {/* Show active range banner */}
            {activeRange && (
              <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <svg className="h-5 w-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm text-blue-800">
                      Active Range: <span className="font-semibold">{activeRange.alias}</span> - Next: <span className="font-mono">{activeRange.year}-{activeRange.next.toString().padStart(5, '0')}</span>
                    </span>
                  </div>
                  <button
                    onClick={() => navigateTo('home')}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Change
                  </button>
                </div>
              </div>
            )}

            {receipt ? (
              <ReceiptDisplay receipt={receipt} onCreateAnother={handleCreateAnother} />
            ) : (
              <DonationForm onSuccess={handleSuccess} />
            )}
          </div>
        ) : currentRoute === 'ranges' ? (
          <RangeManagement />
        ) : null}
      </main>

      <footer className="mt-12 py-6 text-center text-sm text-gray-500 border-t border-gray-200 px-4">
        <p className="marathi mb-1">श्री दत्त देवस्थान, साखरपा</p>
        <p>Temple Receipt Management System © 2025</p>
      </footer>
    </div>
  );
}

export default App;
