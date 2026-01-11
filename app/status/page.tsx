// app/status/page.tsx
// System Status Page

import Link from 'next/link';

export default function StatusPage() {
  return (
    <main className="min-h-screen bg-[#0B0F1A] text-white px-6 py-24">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <Link href="/" className="text-sm text-gray-400 hover:text-white mb-6 inline-block">
            ← Back to home
          </Link>
          <h1 className="text-3xl font-semibold">System Status</h1>
        </div>

        <p className="text-gray-300">
          REOS Foundry systems are operating normally.
        </p>

        <div className="rounded-md border border-gray-700 p-4">
          <div className="flex justify-between text-sm">
            <span>Core Platform</span>
            <span className="text-green-400">Operational</span>
          </div>
          <div className="flex justify-between text-sm mt-2">
            <span>Audit Narrative Generation</span>
            <span className="text-green-400">Operational</span>
          </div>
          <div className="flex justify-between text-sm mt-2">
            <span>Messaging Services</span>
            <span className="text-green-400">Operational</span>
          </div>
        </div>

        <p className="text-gray-400 text-sm">
          This page is informational and may be updated periodically.
        </p>
      </div>
    </main>
  );
}
