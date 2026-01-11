// app/regulator/page.tsx
// Investor / Regulator Mode

import Link from 'next/link';

export default function RegulatorPage() {
  return (
    <main className="min-h-screen bg-[#0B0F1A] text-white px-6 py-24">
      <div className="max-w-4xl mx-auto space-y-10">
        <div>
          <Link href="/" className="text-sm text-gray-400 hover:text-white mb-6 inline-block">
            ← Back to home
          </Link>
          <h1 className="text-3xl font-semibold">System Overview</h1>
        </div>

        <p className="text-gray-300">
          This page provides a static explanation of how REOS Foundry governs real estate transactions.
          It contains no live data, screenshots, or customer information.
        </p>

        <ul className="space-y-4 text-gray-300">
          <li>• Transactions are governed by an immutable event ledger.</li>
          <li>• Closing readiness is evaluated continuously from verified facts.</li>
          <li>• Authority is enforced at the command level.</li>
          <li>• Automation is advisory and requires human approval.</li>
          <li>• Audit narratives are generated deterministically.</li>
        </ul>

        <p className="text-gray-400 text-sm">
          This system is designed to reduce uncertainty, prevent failures, and provide defensible explanations when disputes arise.
        </p>
      </div>
    </main>
  );
}
