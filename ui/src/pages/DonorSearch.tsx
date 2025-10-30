import { useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'https://lfg5incxn1.execute-api.ap-south-1.amazonaws.com';

interface DonorInfo {
  donorId: string;
  name: string;
  mobile?: string;
  pan?: string;
  email?: string;
  lifetimeTotal?: number;
  lastDonationDate?: string;
  donationCount?: number;
}

interface Receipt {
  receiptNo: string;
  date: string;
  total: number;
  donor: {
    name: string;
  };
  payment: {
    mode: string;
  };
  createdAt: string;
}

interface SearchResult {
  success: boolean;
  donor: DonorInfo;
  receipts: Receipt[];
  count: number;
}

export function DonorSearch() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SearchResult | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!query.trim()) {
      setError('कृपया शोध शब्द प्रविष्ट करा / Please enter a search term');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`${API_URL}/receipts/search?donor=${encodeURIComponent(query.trim())}`);

      if (!response.ok) {
        if (response.status === 404) {
          setError('दाता सापडला नाही / Donor not found');
        } else {
          throw new Error(`Search failed: ${response.status}`);
        }
        return;
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'शोध अयशस्वी / Search failed';
      setError(message);
      console.error('Donor search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleClear = () => {
    setQuery('');
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 marathi">दात्यांचा शोध</h1>
              <p className="text-sm text-gray-600">Donor Search</p>
            </div>
            <button
              onClick={() => window.location.hash = ''}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              ← Home
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Form */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-6">
          <form onSubmit={handleSearch}>
            <div className="mb-4">
              <label htmlFor="query" className="block text-sm font-medium text-gray-700 mb-2 marathi">
                मोबाइल, पॅन किंवा ईमेल / Mobile, PAN, or Email
              </label>
              <input
                type="text"
                id="query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="9876543210 or ABCDE1234F or donor@example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              />
              <p className="mt-2 text-xs text-gray-500 marathi">
                फोन, पॅन कार्ड किंवा ईमेल वापरून दाता शोधा
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="marathi">शोधत आहे...</span>
                  </span>
                ) : (
                  <span className="marathi">शोधा / Search</span>
                )}
              </button>
              {(query || result) && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium marathi"
                >
                  साफ करा / Clear
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Search Results */}
        {result && result.donor && (
          <div className="space-y-6">
            {/* Donor Info Card */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 marathi">दाता माहिती / Donor Information</h2>
                </div>
                <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 border border-green-300">
                  {result.donor.donationCount || 0} Receipts
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1 marathi">नाव / Name</p>
                  <p className="text-base font-semibold text-gray-900">{result.donor.name}</p>
                </div>

                {result.donor.mobile && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1 marathi">मोबाइल / Mobile</p>
                    <p className="text-base font-semibold text-gray-900">{result.donor.mobile}</p>
                  </div>
                )}

                {result.donor.pan && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">PAN</p>
                    <p className="text-base font-mono font-semibold text-gray-900">{result.donor.pan}</p>
                  </div>
                )}

                {result.donor.email && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1 marathi">ईमेल / Email</p>
                    <p className="text-base font-semibold text-gray-900">{result.donor.email}</p>
                  </div>
                )}

                {result.donor.lifetimeTotal !== undefined && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1 marathi">एकूण देणगी / Lifetime Total</p>
                    <p className="text-lg font-bold text-blue-600">{formatAmount(result.donor.lifetimeTotal)}</p>
                  </div>
                )}

                {result.donor.lastDonationDate && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1 marathi">शेवटची देणगी / Last Donation</p>
                    <p className="text-base font-semibold text-gray-900">{formatDate(result.donor.lastDonationDate)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Receipt History */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-900 marathi">पावती इतिहास / Receipt History</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {result.count} {result.count === 1 ? 'receipt' : 'receipts'} found
                </p>
              </div>

              <div className="divide-y divide-gray-200">
                {result.receipts && result.receipts.length > 0 ? (
                  result.receipts.map((receipt) => (
                    <div key={receipt.receiptNo} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-mono font-bold text-blue-600">{receipt.receiptNo}</h3>
                            <span className="px-2 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-700">
                              {receipt.payment.mode}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <p className="text-gray-600">
                              <span className="font-medium marathi">तारीख:</span> {formatDate(receipt.date)}
                            </p>
                            <p className="text-gray-600">
                              <span className="font-medium marathi">रक्कम:</span> <span className="font-bold text-gray-900">{formatAmount(receipt.total)}</span>
                            </p>
                          </div>
                        </div>
                        <button
                          className="ml-4 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                          onClick={() => {
                            // TODO: Navigate to receipt detail or download PDF
                            alert(`View receipt: ${receipt.receiptNo}`);
                          }}
                        >
                          View
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="mt-2 text-sm text-gray-500 marathi">या दात्यासाठी कोणतीही पावती सापडली नाही</p>
                    <p className="text-xs text-gray-400">No receipts found for this donor</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !result && !error && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-12 text-center">
            <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900 marathi">दाता शोधण्यासाठी प्रारंभ करा</h3>
            <p className="mt-2 text-sm text-gray-500">Start searching for a donor</p>
            <p className="mt-1 text-xs text-gray-400 marathi">
              फोन नंबर, पॅन कार्ड किंवा ईमेल द्वारा दाता शोधा
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
