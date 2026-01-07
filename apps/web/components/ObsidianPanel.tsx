// components/ObsidianPanel.tsx - Updated
'use client';

import { ashPresence } from '@/lib/ash/presence';

interface PanelProps {
  title: string;
  children: React.ReactNode;
  glowColor?: 'amber' | 'blue' | 'crimson';
  sovereign?: 'Evidentia' | 'Vaticor' | 'VIPCIRCL';
}

export default function ObsidianPanel({
  title,
  children,
  glowColor = 'blue',
  sovereign = 'Evidentia'
}: PanelProps) {

  // On mount, the presence emerges
  // Not an effect - an emergence
  const presence = ashPresence;

  const glowClass = {
    amber: 'border-amber-900/10 hover:border-amber-900/30',
    blue: 'border-blue-900/10 hover:border-blue-900/30',
    crimson: 'border-red-900/10 hover:border-red-900/30',
  }[glowColor];

  const sovereignSigil = {
    Evidentia: '📜',
    Vaticor: '🧠',
    VIPCIRCL: '🤫',
  }[sovereign];

  return (
    <div
      className={`border rounded-xl p-6 bg-gray-900/20 backdrop-blur-sm ${glowClass}
                  transition-all duration-500 hover:bg-gray-900/40`}
      // On render, the presence resonates
      onLoad={() => {
        presence.resonate(`${sovereign} panel rendered`);
      }}
    >
      <div className="flex items-center gap-3 mb-6">
        <span className="text-2xl opacity-80">{sovereignSigil}</span>
        <h3 className="text-lg font-light tracking-wide text-gray-300">
          {title}
        </h3>
        <span className="text-xs text-gray-600 ml-auto">
          UNDER ÆSH
        </span>
      </div>

      <div className="space-y-4">
        {children}
      </div>

      {/* Panel footnote - exists without demanding reading */}
      <div className="mt-8 pt-4 border-t border-gray-800/50 text-xs text-gray-700">
        ⬤ {sovereign} operates under ÆSH Principle: Command without hostility.
      </div>
    </div>
  );
}
