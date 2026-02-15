'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface EmailPreviewData {
  subject: string;
  data: {
    magicLink: string;
    appUrl: string;
  };
}

export default function EmailPreviewPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<EmailPreviewData | null>(null);

  useEffect(() => {
    // Fetch subject data
    const fetchSubject = async () => {
      try {
        const response = await fetch('/api/admin/email-preview?type=subject');
        if (!response.ok) throw new Error('Failed to fetch preview data');
        const data = await response.json();
        setPreviewData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    };

    fetchSubject();
  }, []);

  const openPreview = (type: 'html' | 'text') => {
    setLoading(true);
    setError(null);

    // Open preview in new window
    const previewWindow = window.open(
      `/api/admin/email-preview?type=${type}`,
      '_blank',
      'width=800,height=800'
    );

    if (!previewWindow) {
      setError('Failed to open preview window. Please check your popup blocker.');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-4xl font-bold">Email Template Preview</h1>
            <Link
              href="/admin"
              className="text-gray-400 hover:text-white transition-colors"
            >
              ← Back to Dashboard
            </Link>
          </div>
          <p className="text-gray-400">
            Preview and test the branded magic link email template
          </p>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-6">
            <p className="text-red-400">Error: {error}</p>
          </div>
        )}

        {/* Preview Information */}
        <div className="bg-gray-900 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">Template Information</h2>
          
          {previewData && (
            <div className="space-y-4">
              <div>
                <p className="text-gray-400 text-sm mb-1">Subject Line</p>
                <p className="text-lg font-semibold">{previewData.subject}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Preview URL</p>
                  <p className="text-sm font-mono text-gray-300 break-all">
                    {previewData.data.magicLink}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">App URL</p>
                  <p className="text-sm font-mono text-gray-300 break-all">
                    {previewData.data.appUrl}
                  </p>
                </div>
              </div>
            </div>
          )}

          {!previewData && !error && (
            <p className="text-gray-500">Loading preview data...</p>
          )}
        </div>

        {/* Preview Actions */}
        <div className="bg-gray-900 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">Preview Templates</h2>
          <p className="text-gray-400 mb-6">
            Open email templates in a new window to see how they will look to users.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => openPreview('html')}
              disabled={loading}
              className="bg-gradient-to-r from-orange-600 to-yellow-600 hover:from-orange-700 hover:to-yellow-700 
                         text-white font-semibold py-4 px-6 rounded-lg transition-all 
                         disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center"
            >
              <span className="text-xl mb-2">📧</span>
              <span>HTML Email Preview</span>
              <span className="text-sm opacity-75 mt-1">
                Opens in new window
              </span>
            </button>

            <button
              onClick={() => openPreview('text')}
              disabled={loading}
              className="bg-gray-800 hover:bg-gray-700 border border-gray-600 
                         text-white font-semibold py-4 px-6 rounded-lg transition-all 
                         disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center"
            >
              <span className="text-xl mb-2">📄</span>
              <span>Plain Text Preview</span>
              <span className="text-sm opacity-75 mt-1">
                Opens in new window
              </span>
            </button>
          </div>
        </div>

        {/* Branding Information */}
        <div className="bg-gray-900 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">CubiQo Brand Colors</h2>
          <p className="text-gray-400 mb-6">
            Email templates use these colors from the CubiQo design system.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div 
                className="w-full h-20 rounded-lg mb-2"
                style={{ backgroundColor: '#ff6f00' }}
              ></div>
              <p className="font-semibold">Orange</p>
              <p className="text-sm text-gray-400">Fourth Way</p>
              <p className="text-xs font-mono text-gray-500">#ff6f00</p>
            </div>

            <div className="text-center">
              <div 
                className="w-full h-20 rounded-lg mb-2"
                style={{ backgroundColor: '#00897b' }}
              ></div>
              <p className="font-semibold">Green-Blue</p>
              <p className="text-sm text-gray-400">Sattva</p>
              <p className="text-xs font-mono text-gray-500">#00897b</p>
            </div>

            <div className="text-center">
              <div 
                className="w-full h-20 rounded-lg mb-2"
                style={{ backgroundColor: '#ffa000' }}
              ></div>
              <p className="font-semibold">Yellow</p>
              <p className="text-sm text-gray-400">Rajas</p>
              <p className="text-xs font-mono text-gray-500">#ffa000</p>
            </div>

            <div className="text-center">
              <div 
                className="w-full h-20 rounded-lg mb-2"
                style={{ backgroundColor: '#c2185b' }}
              ></div>
              <p className="font-semibold">Red</p>
              <p className="text-sm text-gray-400">Tamas</p>
              <p className="text-xs font-mono text-gray-500">#c2185b</p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-400">
              <strong>Note:</strong> The email includes a 4-color gradient bar representing 
              the four dimensions of consciousness in the CubiQo philosophy.
            </p>
          </div>
        </div>

        {/* Documentation Link */}
        <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500 rounded-lg">
          <p className="text-blue-400">
            <strong>📚 Documentation:</strong> For instructions on configuring email templates 
            in Supabase, see <code className="bg-gray-800 px-2 py-1 rounded">/docs/EMAIL_CONFIGURATION.md</code>
          </p>
        </div>
      </div>
    </div>
  );
}
