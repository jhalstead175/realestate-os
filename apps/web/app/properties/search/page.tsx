'use client';

export default function PropertySearchPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-blue-100">
      <div className="text-center p-8 bg-white rounded-lg shadow-xl max-w-md">
        <div className="mb-6">
          <div className="text-6xl mb-4">🏠</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Property Search Coming Soon
          </h1>
          <p className="text-gray-600">
            We're building a powerful property search engine. Stay tuned!
          </p>
        </div>
        <div className="border-t pt-6 mt-6">
          <a
            href="/"
            className="inline-block px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 transition-colors"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
