/**
 * Delivery Worker
 *
 * Processes pending messages from messaging_outbox.
 * Retryable, idempotent, auditable.
 */

import { supabaseServer } from '@/lib/supabase/server';
import { sendEmail } from './providers/email';
import { sendSMS } from './providers/sms';

interface Message {
  id: string;
  deal_id: string;
  trigger_event_id: string;
  channel: 'email' | 'sms';
  template_id: string;
  rendered_body: string;
  recipients: string[];
  status: string;
}

/**
 * Deliver pending messages
 *
 * Called by cron job or background worker.
 * Processes messages in batches.
 */
export async function deliverMessages(batchSize: number = 50): Promise<{
  sent: number;
  failed: number;
}> {
  // Load pending messages
  const { data: pending, error: fetchError } = await supabaseServer
    .from('messaging_outbox')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(batchSize);

  if (fetchError) {
    console.error('Failed to fetch pending messages:', fetchError);
    return { sent: 0, failed: 0 };
  }

  if (!pending || pending.length === 0) {
    console.log('No pending messages to deliver');
    return { sent: 0, failed: 0 };
  }

  console.log(`Processing ${pending.length} pending messages...`);

  let sentCount = 0;
  let failedCount = 0;

  for (const msg of pending as Message[]) {
    try {
      // Deliver message
      const providerId =
        msg.channel === 'email'
          ? await sendEmail({
              recipients: msg.recipients,
              body: msg.rendered_body,
              templateId: msg.template_id,
            })
          : await sendSMS({
              recipients: msg.recipients,
              body: msg.rendered_body,
            });

      // Mark as sent
      const { error: updateError } = await supabaseServer
        .from('messaging_outbox')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          provider_message_id: providerId,
        })
        .eq('id', msg.id);

      if (updateError) {
        console.error(`Failed to update message ${msg.id}:`, updateError);
        failedCount++;
      } else {
        sentCount++;
      }
    } catch (err) {
      console.error(`Failed to deliver message ${msg.id}:`, err);

      // Mark as failed
      const { error: updateError } = await supabaseServer
        .from('messaging_outbox')
        .update({
          status: 'failed',
          metadata: {
            error: err instanceof Error ? err.message : String(err),
            failed_at: new Date().toISOString(),
          },
        })
        .eq('id', msg.id);

      if (updateError) {
        console.error(`Failed to mark message as failed ${msg.id}:`, updateError);
      }

      failedCount++;
    }
  }

  console.log(`Delivery complete: ${sentCount} sent, ${failedCount} failed`);

  return { sent: sentCount, failed: failedCount };
}

/**
 * Retry failed messages
 *
 * Resets failed messages to pending for retry.
 */
export async function retryFailedMessages(maxRetries: number = 3): Promise<number> {
  const { data: failed } = await supabaseServer
    .from('messaging_outbox')
    .select('*')
    .eq('status', 'failed');

  if (!failed || failed.length === 0) {
    return 0;
  }

  // Filter messages that haven't exceeded max retries
  const retriable = failed.filter((msg) => {
    const retryCount = msg.metadata?.retry_count || 0;
    return retryCount < maxRetries;
  });

  if (retriable.length === 0) {
    return 0;
  }

  // Reset to pending
  const updates = retriable.map((msg) => ({
    id: msg.id,
    status: 'pending',
    metadata: {
      ...msg.metadata,
      retry_count: (msg.metadata?.retry_count || 0) + 1,
    },
  }));

  for (const update of updates) {
    await supabaseServer
      .from('messaging_outbox')
      .update({ status: update.status, metadata: update.metadata })
      .eq('id', update.id);
  }

  console.log(`Reset ${retriable.length} failed messages for retry`);

  return retriable.length;
}
