/**
 * Message Log (Read-Only)
 *
 * Displays all notifications sent for a transaction.
 * Fully auditable, governance-safe.
 */

import { supabaseServer } from '@/lib/supabase/server';

interface Message {
  id: string;
  channel: 'email' | 'sms';
  recipients: string[];
  status: 'pending' | 'sent' | 'failed';
  sent_at: string | null;
  created_at: string;
  rendered_body: string;
  template_id: string;
}

export default async function MessageLogPage({
  params,
}: {
  params: { id: string };
}) {
  const dealId = params.id;

  const { data: messages, error } = await supabaseServer
    .from('messaging_outbox')
    .select('*')
    .eq('deal_id', dealId)
    .order('created_at', { ascending: false });

  if (error) {
    return (
      <main className="max-w-5xl mx-auto p-8">
        <h1 className="text-2xl font-semibold mb-4">Message Log</h1>
        <div className="text-red-600">Failed to load messages: {error.message}</div>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Message Log</h1>
        <p className="text-sm text-gray-500 mt-1">
          All notifications sent for this transaction. Event-driven, fully
          auditable.
        </p>
      </header>

      {!messages || messages.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No messages sent for this transaction.
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-700">
                {messages.length}
              </div>
              <div className="text-sm text-blue-600">Total Messages</div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-700">
                {messages.filter((m) => m.status === 'sent').length}
              </div>
              <div className="text-sm text-green-600">Sent</div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-red-700">
                {messages.filter((m) => m.status === 'failed').length}
              </div>
              <div className="text-sm text-red-600">Failed</div>
            </div>
          </div>

          {/* Message Table */}
          <table className="w-full text-sm border rounded-lg overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left">Channel</th>
                <th className="p-3 text-left">Template</th>
                <th className="p-3 text-left">Recipients</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Sent</th>
                <th className="p-3 text-left">Created</th>
              </tr>
            </thead>
            <tbody>
              {(messages as Message[]).map((m) => (
                <tr key={m.id} className="border-t hover:bg-gray-50">
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        m.channel === 'email'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}
                    >
                      {m.channel.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-3 text-gray-600">{m.template_id}</td>
                  <td className="p-3 text-gray-600">
                    {m.recipients.join(', ')}
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        m.status === 'sent'
                          ? 'bg-green-100 text-green-700'
                          : m.status === 'failed'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {m.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-3 text-gray-600">
                    {m.sent_at ? new Date(m.sent_at).toLocaleString() : '—'}
                  </td>
                  <td className="p-3 text-gray-600">
                    {new Date(m.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </main>
  );
}
