/**
 * Automation Registry
 *
 * Static, declarative registry of micro-automations.
 * No dynamic registration. No per-tenant logic.
 *
 * This is infrastructure, not product config.
 */

export interface AutomationSpec {
  id: string;
  triggerEvents: string[];
  agent: string;
  autoApprove: boolean;
}

/**
 * Automation Registry
 *
 * Defines which events trigger which agents.
 */
export const AUTOMATIONS: AutomationSpec[] = [
  {
    id: 'request-missing-docs',
    triggerEvents: ['CONTRACT_ACCEPTED'],
    agent: 'doc-collector',
    autoApprove: false, // Requires human approval
  },
  {
    id: 'notify-lender',
    triggerEvents: ['ESCROW_OPENED'],
    agent: 'lender-notify',
    autoApprove: true, // Auto-approved but still enforced
  },
  {
    id: 'closing-checklist',
    triggerEvents: ['TransactionStateAdvanced'],
    agent: 'closing-coordinator',
    autoApprove: false,
  },
];
