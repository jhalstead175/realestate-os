'use client';

export default function DashboardPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center p-8 bg-white rounded-lg shadow-xl max-w-md">
        <div className="mb-6">
          <div className="text-6xl mb-4">🏗️</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Dashboard Coming Soon
          </h1>
          <p className="text-gray-600">
            We're building an amazing CRM dashboard for you. Check back soon!
          </p>
        </div>
        <div className="border-t pt-6 mt-6">
          <a
            href="/"
            className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-colors"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
