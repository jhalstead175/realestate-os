/**
 * Dead-Letter Inbox
 *
 * Operator view for automation failures.
 * Shows:
 * - Failure details
 * - Error stack traces
 * - Input snapshots
 * - Replay capability
 *
 * This is for operators, not agents.
 */

import { supabaseServer } from '@/lib/supabase/server';
import { DeadLetterList } from './DeadLetterList';

export default async function DeadLetterPage() {
  const { data, error } = await supabaseServer
    .from('automation_dead_letters')
    .select('*')
    .eq('resolved', false)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to load dead letters:', error);
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Dead-Letter Queue</h1>
        <div className="text-red-600">Failed to load dead letters: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Dead-Letter Queue</h1>
        <p className="text-gray-600 mt-2">
          Automation failures awaiting resolution
        </p>
      </div>
      <DeadLetterList items={data ?? []} />
    </div>
  );
}
