import { useState } from 'react';
import type { CreateReceiptResponse } from './types';
import { Header } from './components/Header';
import { DonationForm } from './components/DonationForm';
import { ReceiptDisplay } from './components/ReceiptDisplay';
import { RangeManagement } from './components/RangeManagement';

type Tab = 'receipts' | 'ranges';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('receipts');
  const [receipt, setReceipt] = useState<CreateReceiptResponse | null>(null);

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

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setReceipt(null); // Reset receipt when switching tabs
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => handleTabChange('receipts')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'receipts'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Receipt Entry
            </button>
            <button
              onClick={() => handleTabChange('ranges')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'ranges'
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
        {activeTab === 'receipts' ? (
          <div className="max-w-4xl mx-auto">
            {receipt ? (
              <ReceiptDisplay receipt={receipt} onCreateAnother={handleCreateAnother} />
            ) : (
              <DonationForm onSuccess={handleSuccess} />
            )}
          </div>
        ) : (
          <RangeManagement />
        )}
      </main>

      <footer className="mt-12 py-6 text-center text-sm text-gray-500 border-t border-gray-200 px-4">
        <p className="marathi mb-1">श्री दत्त देवस्थान, साखरपा</p>
        <p>Temple Receipt Management System © 2025</p>
      </footer>
    </div>
  );
}

export default App;
