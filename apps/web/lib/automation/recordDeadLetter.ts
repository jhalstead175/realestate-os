/**
 * Dead-Letter Recorder
 *
 * Records automation failures with full context for replay.
 * Deterministic, append-only, auditable.
 *
 * If this fails, something is deeply wrong.
 */

import { supabaseServer } from '@/lib/supabase/server';

export interface DeadLetterInput {
  automationId: string;
  agent: string;
  aggregateId: string;
  triggeringEventId: string;
  failureStage:
    | 'agent_invocation'
    | 'proposal_generation'
    | 'legality_validation'
    | 'enqueue'
    | 'unknown';
  error: Error;
  inputSnapshot: unknown;
}

/**
 * Record automation failure to dead-letter queue
 *
 * No retries here. If this fails, something is deeply wrong.
 */
export async function recordDeadLetter(input: DeadLetterInput): Promise<void> {
  const {
    automationId,
    agent,
    aggregateId,
    triggeringEventId,
    failureStage,
    error,
    inputSnapshot,
  } = input;

  try {
    const { error: insertError } = await supabaseServer
      .from('automation_dead_letters')
      .insert({
        automation_id: automationId,
        agent,
        aggregate_id: aggregateId,
        triggering_event_id: triggeringEventId,
        failure_stage: failureStage,
        error_message: error.message,
        error_stack: error.stack,
        input_snapshot: inputSnapshot,
      });

    if (insertError) {
      // If we can't record the failure, log to stderr
      console.error('CRITICAL: Failed to record dead letter:', insertError);
      console.error('Original error:', error);
    }
  } catch (criticalError) {
    // Last resort: log to stderr
    console.error('CRITICAL: Dead letter recording failed:', criticalError);
    console.error('Original error:', error);
  }
}
