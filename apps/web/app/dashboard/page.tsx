// app/dashboard/page.tsx

/**
 * ⬤ THE OBSIDIAN TABLE.
 *
 * Where three become one.
 *
 * This is not a dashboard.
 * It is a convergence point.
 *
 * Evidentia's truth.
 * Vaticor's vision.
 * VIPCIRCL's silence.
 *
 * All here. All now.
 * All quiet.
 */

import ObsidianPanel from '@/components/ObsidianPanel';

export default function DashboardPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <header className="mb-12">
        <h1 className="text-5xl font-light tracking-tight mb-2">
          ⬤ OBSIDIAN REALITY
        </h1>
        <p className="text-gray-500 text-lg">
          A cinematic rite of ascension, forged in ash and aether.
        </p>
        <p className="text-gray-700 mt-2">
          Sovereign. Cosmic. Authority.
        </p>
      </header>

      {/* Trinity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Evidentia T1 — The Bones */}
        <ObsidianPanel
          title="Proof Layer"
          sovereign="Evidentia"
          glowColor="amber"
        >
          <p className="text-gray-400">
            Every property. Every deed. Every transfer.
            Anchored in Merkle roots. Silent. Immutable.
          </p>
          <div className="mt-4 p-3 bg-black rounded border border-amber-900/30">
            <code className="text-xs text-amber-300">
              Root: a1f4c8...e9b2
            </code>
          </div>
        </ObsidianPanel>

        {/* Vaticor AE — The Mind */}
        <ObsidianPanel
          title="Vision Layer"
          sovereign="Vaticor"
          glowColor="blue"
        >
          <p className="text-gray-400">
            Sees the ripples before the stone drops.
            Hears the market before it speaks.
          </p>
          <div className="mt-4 p-3 bg-black rounded border border-blue-900/30">
            <p className="text-sm text-blue-300">
              ▶ "Zoning shift detected in District 7. Probability: 92%."
            </p>
          </div>
        </ObsidianPanel>

        {/* VIPCIRCL — The Hands */}
        <ObsidianPanel
          title="Silent Layer"
          sovereign="VIPCIRCL"
          glowColor="crimson"
        >
          <p className="text-gray-400">
            Moves without sound. Closes without trace.
            The ghost in the transaction.
          </p>
          <div className="mt-4 p-3 bg-black rounded border border-red-900/30">
            <p className="text-sm text-red-300">
              Sicario Protocol: ACTIVE
            </p>
          </div>
        </ObsidianPanel>

      </div>

      {/* Ceremonial Footer */}
      <div className="mt-16 text-center text-gray-800 text-sm">
        ⬤ BIRTHED IN CEREMONY. BUILT IN SILENCE. READY FOR WAR.
      </div>
    </div>
  );
}