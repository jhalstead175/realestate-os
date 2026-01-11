/**
 * CommandRail Container
 *
 * Stateful wrapper around CommandRail.
 * Handles confirmation modal and command invocation.
 *
 * Critical properties:
 * - Modal does not decide whether command exists
 * - Command cannot be altered
 * - Context hash passed through untouched
 * - API remains final gate
 */

'use client';

import { useState } from 'react';
import { CommandRail } from './CommandRail';
import { CommandConfirmModal } from './CommandConfirmModal';
import { invokeCommand } from '@/lib/api/invokeCommand';
import { usePendingEvents } from '@/lib/events/usePendingEvents';
import type { CommandDescriptor } from '@/lib/commands/types';

export function CommandRailContainer({
  commands,
  contextHash,
}: {
  commands: CommandDescriptor[];
  contextHash: string;
}) {
  const [pending, setPending] = useState<CommandDescriptor | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { pending: pendingEvents, markPending } = usePendingEvents();

  async function execute(cmd: CommandDescriptor) {
    setSubmitting(true);
    try {
      const res = await invokeCommand({
        command: {
          type: cmd.type,
          eventType: cmd.eventType,
          payload: cmd.payload,
        },
        contextHash,
      });

      // Mark event as pending (optimistic UI)
      if (res?.eventId) {
        markPending(res.eventId);
      }

      // Success - page will rehydrate via server component refresh
    } catch (error) {
      // Error handled by invokeCommand (thrown)
      console.error('Command execution failed:', error);
      throw error;
    } finally {
      setSubmitting(false);
      setPending(null);
    }
  }

  // Disable commands while events are pending (prevents double-submit)
  const hasPending = pendingEvents.size > 0;

  return (
    <>
      <CommandRail
        commands={commands.map((c) => ({
          ...c,
          enabled: c.enabled && !hasPending,
        }))}
        onSelect={(cmd) => {
          if (cmd.requiresConfirmation) {
            setPending(cmd);
          } else {
            execute(cmd);
          }
        }}
      />

      <CommandConfirmModal
        open={!!pending}
        title={pending?.confirmationCopy?.title ?? 'Confirm action'}
        body={
          pending?.confirmationCopy?.body ??
          'Are you sure you want to proceed?'
        }
        confirmLabel={pending?.confirmationCopy?.confirmLabel}
        onCancel={() => setPending(null)}
        onConfirm={() => pending && execute(pending)}
      />
    </>
  );
}
