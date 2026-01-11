// app/terms/page.tsx
// Terms Page

import Link from 'next/link';

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#0B0F1A] text-white px-6 py-24">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <Link href="/" className="text-sm text-gray-400 hover:text-white mb-6 inline-block">
            ← Back to home
          </Link>
          <h1 className="text-3xl font-semibold">Terms</h1>
        </div>

        <p className="text-gray-300">
          REOS Foundry provides software infrastructure for transaction governance.
        </p>

        <ul className="space-y-4 text-gray-300">
          <li>• The service is provided to enterprise customers under written agreement.</li>
          <li>• No legal, financial, or brokerage advice is provided.</li>
          <li>• Customers remain responsible for compliance with applicable laws.</li>
        </ul>

        <p className="text-gray-400 text-sm">
          Full terms are defined in the Master Services Agreement executed with each customer.
        </p>
      </div>
    </main>
  );
}
