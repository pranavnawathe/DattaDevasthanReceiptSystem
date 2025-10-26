import { useState } from 'react';
import type { CreateReceiptResponse } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { api } from '../services/api';

interface ReceiptDisplayProps {
  receipt: CreateReceiptResponse;
  onCreateAnother: () => void;
}

export function ReceiptDisplay({ receipt, onCreateAnother }: ReceiptDisplayProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const handleDownload = async () => {
    setIsDownloading(true);
    setDownloadError(null);

    try {
      const downloadUrl = await api.getReceiptDownloadUrl(receipt.receiptNo);
      window.open(downloadUrl, '_blank');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to download receipt';
      setDownloadError(errorMessage);
      console.error('Download error:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-8">
      {/* Success Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-success bg-opacity-20 rounded-full mb-4">
          <svg className="w-8 h-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-secondary mb-2">
          <span className="marathi">पावती यशस्वीरित्या तयार झाली!</span>
        </h2>
        <p className="text-lg text-gray-600">Receipt Created Successfully!</p>
      </div>

      {/* Receipt Details */}
      <div className="bg-gradient-to-br from-primary from-opacity-5 to-accent to-opacity-5 border-2 border-primary border-opacity-30 rounded-lg p-6 mb-6">
        <div className="space-y-4">
          {/* Receipt Number */}
          <div className="text-center pb-4 border-b border-gray-300">
            <p className="text-sm text-gray-600 mb-1">
              <span className="marathi">पावती क्रमांक</span> / Receipt Number
            </p>
            <p className="text-3xl font-bold text-primary font-mono tracking-wider">
              {receipt.receiptNo}
            </p>
          </div>

          {/* Donor ID */}
          <div className="flex justify-between items-center py-2">
            <span className="text-sm font-medium text-gray-600">
              <span className="marathi">दात्याचा आयडी</span> / Donor ID:
            </span>
            <span className="text-sm font-mono text-secondary font-semibold">
              {receipt.donorId}
            </span>
          </div>

          {/* Total Amount */}
          <div className="flex justify-between items-center py-2">
            <span className="text-sm font-medium text-gray-600">
              <span className="marathi">एकूण रक्कम</span> / Total Amount:
            </span>
            <span className="text-2xl font-bold text-secondary">
              {formatCurrency(receipt.total)}
            </span>
          </div>

          {/* Date */}
          <div className="flex justify-between items-center py-2">
            <span className="text-sm font-medium text-gray-600">
              <span className="marathi">दिनांक</span> / Date:
            </span>
            <span className="text-sm font-semibold text-gray-700">
              {formatDate(receipt.createdAt)}
            </span>
          </div>
        </div>
      </div>

      {/* Success Message */}
      <div className="bg-success bg-opacity-10 border-l-4 border-success p-4 rounded mb-6">
        <p className="text-sm text-gray-700">
          <span className="marathi font-medium">
            देणगीची नोंद यशस्वीपणे झाली आहे. पावती डाउनलोड करण्यासाठी खालील बटण वापरा.
          </span>
        </p>
        <p className="text-sm text-gray-600 mt-1">
          The donation has been recorded successfully. Use the button below to download your receipt.
        </p>
      </div>

      {/* Download Error Message */}
      {downloadError && (
        <div className="bg-error bg-opacity-10 border-l-4 border-error p-4 rounded mb-6">
          <p className="text-sm text-error font-medium">
            <span className="marathi">त्रुटी:</span> Error: {downloadError}
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className="flex-1 bg-secondary hover:bg-opacity-90 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-md transition-colors flex items-center justify-center gap-2"
        >
          {isDownloading ? (
            <>
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>
                <span className="marathi">डाउनलोड करीत आहे...</span> / Downloading...
              </span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>
                <span className="marathi">पावती डाउनलोड करा</span> / Download Receipt
              </span>
            </>
          )}
        </button>

        <button
          onClick={onCreateAnother}
          className="flex-1 bg-primary hover:bg-opacity-90 text-white font-semibold py-3 px-6 rounded-md transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>
            <span className="marathi">नवीन पावती तयार करा</span> / Create Another Receipt
          </span>
        </button>
      </div>

      {/* Receipt File Info */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          Receipt file: <span className="font-mono">{receipt.pdfKey}</span>
        </p>
      </div>
    </div>
  );
}
