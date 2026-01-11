/**
 * Command Types
 *
 * Defines the contract for what a command is.
 * Confirmation is metadata only - does not change legality or behavior.
 */

export interface CommandDescriptor {
  type: string;
  label: string;
  enabled: boolean;
  eventType: string;
  payload: unknown;
  requiresConfirmation?: boolean;
  confirmationCopy?: {
    title: string;
    body: string;
    confirmLabel?: string;
  };
}
