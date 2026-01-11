// app/security/page.tsx
// Security & Governance Page

import Link from 'next/link';

export default function SecurityPage() {
  return (
    <main className="min-h-screen bg-[#0B0F1A] text-white px-6 py-24">
      <div className="max-w-4xl mx-auto space-y-12">
        <div>
          <Link href="/" className="text-sm text-gray-400 hover:text-white mb-6 inline-block">
            ← Back to home
          </Link>
          <h1 className="text-3xl font-semibold">Security & Governance</h1>
        </div>

        <Section
          title="Event-Sourced System of Record"
          body="All transaction activity is captured as immutable events. State is derived, never overwritten. This enables replay, verification, and historical accuracy."
        />

        <Section
          title="Audit-Grade Narratives"
          body="At any point in time, REOS Foundry can generate a deterministic narrative explaining what occurred, why decisions were made, and who held authority."
        />

        <Section
          title="Authority Enforcement"
          body="Actions are governed by explicit authority rules. No agent, automation, or external system can bypass enforced permissions."
        />

        <Section
          title="External System Safety"
          body="CRMs, MLS feeds, and vendor systems may inform context but can never mutate transaction truth or closing readiness."
        />
      </div>
    </main>
  );
}

function Section({ title, body }: { title: string; body: string }) {
  return (
    <section>
      <h2 className="text-xl font-semibold mb-3">{title}</h2>
      <p className="text-gray-300">{body}</p>
    </section>
  );
}
