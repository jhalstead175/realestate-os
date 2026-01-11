// app/privacy/page.tsx
// Privacy Page

import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#0B0F1A] text-white px-6 py-24">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <Link href="/" className="text-sm text-gray-400 hover:text-white mb-6 inline-block">
            ← Back to home
          </Link>
          <h1 className="text-3xl font-semibold">Privacy</h1>
        </div>

        <p className="text-gray-300">
          REOS Foundry is built to minimize data collection and maximize clarity.
        </p>

        <ul className="space-y-4 text-gray-300">
          <li>• We collect only information necessary to operate the system.</li>
          <li>• We do not sell personal or transaction data.</li>
          <li>• Data is used solely to provide transaction governance and auditability.</li>
          <li>• Demo requests are reviewed by humans and are not added to marketing lists.</li>
        </ul>

        <p className="text-gray-400 text-sm">
          For enterprise customers, data handling is governed by contractual agreements.
        </p>
      </div>
    </main>
  );
}
