/**
 * Execution Spine - Server Actions
 *
 * These actions wrap the execution spine for use by UI components.
 * They run server-side and enforce the law.
 */

'use server';

import { getCommandResolution } from './apiGuard';
import type { CommandResolution } from './types';

/**
 * Get command resolution for actor (server action)
 *
 * This is the UI binding layer. The UI calls this to get available command.
 */
export async function getCommand(params: {
  actorId: string;
  transactionId: string;
}): Promise<CommandResolution> {
  return await getCommandResolution(params);
}
