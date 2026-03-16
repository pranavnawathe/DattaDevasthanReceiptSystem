import { useState, useEffect } from 'react';
import type { CreateReceiptResponse } from './types';
import { Header } from './components/Header';
import { DonationForm } from './components/DonationForm';
import { ReceiptDisplay } from './components/ReceiptDisplay';
import { AdminHome } from './pages/AdminHome';
import { DonorSearch } from './pages/DonorSearch';
import { ExportData } from './pages/ExportData';

type Route = 'home' | 'receipts' | 'donors' | 'export';

function App() {
  const [currentRoute, setCurrentRoute] = useState<Route>('home');
  const [receipt, setReceipt] = useState<CreateReceiptResponse | null>(null);

  // Handle hash-based routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1); // Remove '#'
      if (hash === 'receipts' || hash === 'issue') {
        setCurrentRoute('receipts');
      } else if (hash === 'donors') {
        setCurrentRoute('donors');
      } else if (hash === 'export') {
        setCurrentRoute('export');
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCreateAnother = () => {
    setReceipt(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateTo = (route: Route) => {
    if (route === 'home') {
      window.location.hash = '';
    } else {
      window.location.hash = route;
    }
  };

  if (currentRoute === 'home') {
    return <AdminHome />;
  }

  if (currentRoute === 'donors') {
    return <DonorSearch />;
  }

  if (currentRoute === 'export') {
    return <ExportData />;
  }

  // Receipts route
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigateTo('home')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            ← मुखपृष्ठ / Home
          </button>

          {receipt ? (
            <ReceiptDisplay receipt={receipt} onCreateAnother={handleCreateAnother} />
          ) : (
            <DonationForm onSuccess={handleSuccess} />
          )}
        </div>
      </main>

      <footer className="mt-12 py-6 text-center text-sm text-gray-500 border-t border-gray-200 px-4">
        <p className="marathi mb-1">श्री दत्त देवस्थान, साखरपा</p>
        <p>Temple Receipt Management System © 2025</p>
      </footer>
    </div>
  );
}

export default App;
