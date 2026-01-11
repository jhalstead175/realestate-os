/**
 * Command API - Advance to Closing
 *
 * This is an enforcement gate. The execution spine guards this endpoint.
 * If the guard passes, the command is legal and will be executed.
 *
 * UI intent is irrelevant. Law is enforced here.
 */

import { NextRequest, NextResponse } from 'next/server';
import { guardCommand } from '@/lib/execution';
import { emitEvent } from '@/lib/db/events';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { actorId, transactionId, justification } = body;

    // ENFORCEMENT: Guard with execution spine
    const { context, command } = await guardCommand({
      actorId,
      transactionId,
      expectedCommandType: 'advance_to_closing',
    });

    // If we reach here, command is legal
    // Guard passed, now emit event

    const event = await emitEvent({
      entity_type: 'Transaction',
      entity_id: transactionId,
      event_type: 'TransactionStateAdvanced',
      payload: {
        from_state: context.transactionState,
        to_state: 'closing',
        justification: justification || 'All readiness conditions met',
        closing_readiness_state: context.closingReadiness,
      },
      actor_id: actorId,
    });

    return NextResponse.json({
      success: true,
      event,
      message: 'Transaction advanced to closing',
    });
  } catch (error) {
    // Guard rejected or other error
    console.error('Advance to closing failed:', error);

    const message =
      error instanceof Error ? error.message : 'Failed to advance to closing';

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 403 } // Forbidden
    );
  }
}
