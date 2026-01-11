/**
 * Mobile Message Log
 *
 * Calm, glanceable notification history for mobile agents.
 * Shows what notifications were sent, when, and their status.
 */

import { supabaseServer } from '@/lib/supabase/server';

export default async function MobileMessages({
  params,
}: {
  params: { id: string };
}) {
  const dealId = params.id;

  // Load messages (read-only)
  const { data: messages } = await supabaseServer
    .from('messaging_outbox')
    .select('id, channel, status, created_at, rendered_body')
    .eq('deal_id', dealId)
    .order('created_at', { ascending: false });

  return (
    <main className="p-4 space-y-2 max-w-md mx-auto">
      {messages?.map((m) => (
        <div key={m.id} className="border border-gray-200 rounded-lg p-3 bg-white">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>{m.channel.toUpperCase()}</span>
            <span>{m.status}</span>
          </div>
          <div className="text-xs text-gray-400">
            {new Date(m.created_at).toLocaleString()}
          </div>
        </div>
      ))}

      {(!messages || messages.length === 0) && (
        <div className="text-center text-gray-500 py-8">
          No messages sent yet.
        </div>
      )}
    </main>
  );
}
