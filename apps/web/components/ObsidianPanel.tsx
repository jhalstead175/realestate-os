// components/ObsidianPanel.tsx

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

  const glowClass = {
    amber: 'border-amber-900/20 shadow-amber-900/5',
    blue: 'border-blue-900/20 shadow-blue-900/5',
    crimson: 'border-red-900/20 shadow-red-900/5',
  }[glowColor];

  const sovereignSigil = {
    Evidentia: '📜',
    Vaticor: '🧠',
    VIPCIRCL: '🤫',
  }[sovereign];

  return (
    <div className={`border rounded-xl p-6 bg-gray-900/40 backdrop-blur-md ${glowClass} transition-all hover:bg-gray-900/60`}>
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">{sovereignSigil}</span>
        <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
        <span className="text-xs text-gray-600 ml-auto">
          {sovereign} SOVEREIGN
        </span>
      </div>
      <div className="space-y-4">
        {children}
      </div>
      {/* Panel footnote */}
      <div className="mt-6 pt-4 border-t border-gray-800 text-xs text-gray-600">
        ⬤ This panel breathes with the {sovereign} protocol. Touch with intent.
      </div>
    </div>
  );
}
