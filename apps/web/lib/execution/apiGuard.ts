/**
 * Execution Spine - API Guard
 *
 * Every command endpoint MUST use this guard.
 * UI intent is irrelevant. Law is enforced here.
 *
 * NON-NEGOTIABLE.
 */

import { buildDecisionContext } from './buildContext';
import { resolveAvailableCommand } from './commandResolution';
import type { CommandResolution } from './types';

/**
 * Guard API endpoint with execution spine enforcement
 *
 * This function:
 * 1. Builds decision context from events
 * 2. Resolves available command based on law
 * 3. Validates request matches allowed command
 * 4. Returns context if valid, throws if invalid
 *
 * Usage:
 * ```typescript
 * const ctx = await guardCommand({
 *   actorId: 'agent_1',
 *   transactionId: 'txn_123',
 *   expectedCommandType: 'advance_to_closing'
 * });
 * ```
 *
 * @throws {Error} If command is not allowed
 */
export async function guardCommand(params: {
  actorId: string;
  transactionId: string;
  expectedCommandType: CommandResolution['type'];
}): Promise<{
  context: Awaited<ReturnType<typeof buildDecisionContext>>;
  command: CommandResolution;
}> {
  const { actorId, transactionId, expectedCommandType } = params;

  // Build decision context (the truth)
  const context = await buildDecisionContext({ actorId, transactionId });

  // Resolve available command (the law)
  const command = resolveAvailableCommand(context);

  // Enforce: command type must match expectation
  if (command.type !== expectedCommandType) {
    throw new Error(
      `Illegal command attempt: expected '${expectedCommandType}', but only '${command.type}' is allowed. Reason: ${
        command.type === 'none' ? command.reason : 'different action required'
      }`
    );
  }

  return { context, command };
}

/**
 * Guard attestation issuance
 *
 * Specialized guard for issue_attestation commands.
 * Validates both command type AND attestation type.
 */
export async function guardAttestationIssuance(params: {
  actorId: string;
  transactionId: string;
  attestationType: string;
}): Promise<{
  context: Awaited<ReturnType<typeof buildDecisionContext>>;
  command: Extract<CommandResolution, { type: 'issue_attestation' }>;
}> {
  const { actorId, transactionId, attestationType } = params;

  // Build context
  const context = await buildDecisionContext({ actorId, transactionId });

  // Resolve command
  const command = resolveAvailableCommand(context);

  // Validate is issue_attestation
  if (command.type !== 'issue_attestation') {
    throw new Error(
      `Cannot issue attestation: command not available. Current command: ${command.type}`
    );
  }

  // Validate attestation type matches
  if (command.attestationType !== attestationType) {
    throw new Error(
      `Cannot issue '${attestationType}': only '${command.attestationType}' is authorized`
    );
  }

  return {
    context,
    command: command as Extract<CommandResolution, { type: 'issue_attestation' }>,
  };
}

/**
 * Guard attestation withdrawal
 *
 * Specialized guard for withdraw_attestation commands.
 */
export async function guardAttestationWithdrawal(params: {
  actorId: string;
  transactionId: string;
  attestationType: string;
}): Promise<{
  context: Awaited<ReturnType<typeof buildDecisionContext>>;
  command: Extract<CommandResolution, { type: 'withdraw_attestation' }>;
}> {
  const { actorId, transactionId, attestationType } = params;

  // Build context
  const context = await buildDecisionContext({ actorId, transactionId });

  // Resolve command
  const command = resolveAvailableCommand(context);

  // Validate is withdraw_attestation
  if (command.type !== 'withdraw_attestation') {
    throw new Error(
      `Cannot withdraw attestation: command not available. Current command: ${command.type}`
    );
  }

  // Validate attestation type matches
  if (command.attestationType !== attestationType) {
    throw new Error(
      `Cannot withdraw '${attestationType}': only '${command.attestationType}' is authorized`
    );
  }

  return {
    context,
    command: command as Extract<
      CommandResolution,
      { type: 'withdraw_attestation' }
    >,
  };
}

/**
 * Get command resolution without guard (read-only)
 *
 * Use this for UI rendering. Does not enforce, just returns command.
 */
export async function getCommandResolution(params: {
  actorId: string;
  transactionId: string;
}): Promise<CommandResolution> {
  const context = await buildDecisionContext(params);
  return resolveAvailableCommand(context);
}
