/**
 * API Invocation Helper
 *
 * Client-side only. No server actions.
 *
 * This helper:
 * - Does NOT retry
 * - Does NOT transform
 * - Does NOT swallow errors
 */

'use client';

export async function invokeCommand({
  command,
  contextHash,
}: {
  command: {
    type: string;
    eventType: string;
    payload: unknown;
  };
  contextHash: string;
}) {
  const res = await fetch('/api/commands', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ command, contextHash }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Command rejected' }));
    throw new Error(error.error || 'Command rejected by enforcement spine');
  }

  return res.json();
}
