/**
 * Event-Driven Notification Handler
 *
 * Zero state mutation • Fully auditable • Governance-safe
 *
 * Triggered by events, enqueues messages for delivery.
 * Does NOT mutate transaction state.
 */

import { supabaseServer } from '@/lib/supabase/server';
import { renderTemplate, buildTemplateContext } from './renderTemplate';

interface NotificationSpec {
  channel: 'email' | 'sms';
  templateId: string;
  recipients: string[];
  additionalData?: Record<string, any>;
}

interface HandleNotificationParams {
  event: {
    id: string;
    event_type: string;
    aggregate_id: string;
  };
  decisionContext: any;
  notifications: NotificationSpec[];
}

/**
 * Handle event-triggered notifications
 *
 * Enqueues messages in messaging_outbox for async delivery.
 * Messages are triggered ONLY by events.
 */
export async function handleEventNotification({
  event,
  decisionContext,
  notifications,
}: HandleNotificationParams): Promise<void> {
  // Load templates
  const { data: templates } = await supabaseServer
    .from('message_templates')
    .select('*')
    .in(
      'template_id',
      notifications.map((n) => n.templateId)
    );

  if (!templates || templates.length === 0) {
    console.warn('No templates found for notifications');
    return;
  }

  const templateMap = new Map(templates.map((t) => [t.template_id, t]));

  // Build template context
  const baseContext = buildTemplateContext({
    decisionContext,
    dealId: event.aggregate_id,
  });

  // Enqueue messages
  const messages = notifications.map((n) => {
    const template = templateMap.get(n.templateId);

    if (!template || !template.enabled) {
      console.warn(`Template ${n.templateId} not found or disabled`);
      return null;
    }

    // Merge additional data into context
    const context = { ...baseContext, ...(n.additionalData || {}) };

    // Render body
    const renderedBody = renderTemplate(template.body_template, context);

    return {
      deal_id: event.aggregate_id,
      trigger_event_id: event.id,
      channel: n.channel,
      template_id: n.templateId,
      rendered_body: renderedBody,
      recipients: n.recipients,
      status: 'pending',
      created_at: new Date().toISOString(),
    };
  });

  // Filter out nulls
  const validMessages = messages.filter((m) => m !== null);

  if (validMessages.length === 0) {
    console.warn('No valid messages to enqueue');
    return;
  }

  // Insert into outbox
  const { error } = await supabaseServer
    .from('messaging_outbox')
    .insert(validMessages);

  if (error) {
    console.error('Failed to enqueue messages:', error);
    throw new Error('Failed to enqueue messages');
  }

  console.log(`Enqueued ${validMessages.length} messages for event ${event.id}`);
}

/**
 * Helper: Determine notifications for an event type
 */
export function determineNotificationsForEvent(
  eventType: string,
  decisionContext: any
): NotificationSpec[] {
  const notifications: NotificationSpec[] = [];

  switch (eventType) {
    case 'closing_readiness_determined':
      if (decisionContext.closingReadiness === 'blocked') {
        notifications.push({
          channel: 'email',
          templateId: 'deal_blocked',
          recipients: [decisionContext.actorId], // Send to agent
        });
      } else if (decisionContext.closingReadiness === 'ready') {
        notifications.push({
          channel: 'email',
          templateId: 'deal_ready_to_close',
          recipients: [decisionContext.actorId],
        });
      }
      break;

    case 'automation_proposal_created':
      notifications.push({
        channel: 'email',
        templateId: 'automation_proposal',
        recipients: [decisionContext.actorId],
        additionalData: {
          proposed_action: decisionContext.proposedAction || 'Unknown',
        },
      });
      break;

    case 'federated_event_received':
      notifications.push({
        channel: 'email',
        templateId: 'federated_assertion_received',
        recipients: [decisionContext.actorId],
        additionalData: {
          source_type: decisionContext.sourceType || 'Unknown',
          source_name: decisionContext.sourceName || 'Unknown',
          assertion_status: decisionContext.assertionStatus || 'Unknown',
        },
      });
      break;

    default:
      // No notifications for this event type
      break;
  }

  return notifications;
}
