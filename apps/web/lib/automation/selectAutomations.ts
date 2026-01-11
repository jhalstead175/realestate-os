/**
 * Automation Eligibility Filter
 *
 * Pure function - matches event types to automations.
 *
 * This function:
 * - Does NOT inspect state
 * - Does NOT inspect authority
 * - Only matches declared triggers
 */

import { AUTOMATIONS } from './registry';
import type { AutomationSpec } from './registry';

/**
 * Select automations triggered by event type
 *
 * @param eventType - The event type that was committed
 * @returns Array of automation specs that should run
 */
export function selectAutomations(eventType: string): AutomationSpec[] {
  return AUTOMATIONS.filter((automation) =>
    automation.triggerEvents.includes(eventType)
  );
}
