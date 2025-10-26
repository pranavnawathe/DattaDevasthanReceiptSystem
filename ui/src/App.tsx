import { useState } from 'react';
import type { CreateReceiptResponse } from './types';
import { Header } from './components/Header';
import { DonationForm } from './components/DonationForm';
import { ReceiptDisplay } from './components/ReceiptDisplay';

function App() {
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {receipt ? (
          <ReceiptDisplay receipt={receipt} onCreateAnother={handleCreateAnother} />
        ) : (
          <DonationForm onSuccess={handleSuccess} />
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
