'use client';

interface LeadScoreIndicatorProps {
  score?: number;
  showLabel?: boolean;
}

export function LeadScoreIndicator({ score, showLabel }: LeadScoreIndicatorProps) {
  if (!score) return <span className="text-gray-400">-</span>;

  let color = 'bg-gray-500';
  if (score >= 70) color = 'bg-green-500';
  else if (score >= 40) color = 'bg-yellow-500';
  else color = 'bg-red-500';

  return (
    <div className="flex items-center space-x-2">
      <div className={`w-2 h-2 rounded-full ${color}`}></div>
      <span className="font-semibold">{score}</span>
    </div>
  );
}
