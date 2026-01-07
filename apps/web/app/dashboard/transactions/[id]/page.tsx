'use client';

export default function TransactionDetailPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
      <div className="text-center p-8 bg-white rounded-lg shadow-xl max-w-md">
        <div className="mb-6">
          <div className="text-6xl mb-4">📄</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Transaction Details Coming Soon
          </h1>
          <p className="text-gray-600">
            Detailed transaction views are under construction.
          </p>
        </div>
        <div className="border-t pt-6 mt-6">
          <a
            href="/"
            className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
