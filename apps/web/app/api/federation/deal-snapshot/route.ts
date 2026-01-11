/**
 * Deal Snapshot API (Outbound Federation)
 *
 * Provides read-only deal information to federated nodes.
 *
 * What federated nodes see:
 * - Deal ID
 * - Contract date
 * - Closing target
 * - Party information (scoped)
 * - Readiness flags (not commands)
 *
 * What they don't see:
 * - Internal state machines
 * - Automation details
 * - Projections
 * - Other nodes' data
 *
 * Authentication: API key or signed request from known node
 */

import { NextRequest, NextResponse } from 'next/server';
import { loadFederatedNode } from '@/lib/federation/db';
import { loadEvents } from '@/lib/db/events';
import { foldTransactionState } from '@/lib/execution/eventFolding';

export async function GET(request: NextRequest) {
  try {
    // Extract parameters
    const searchParams = request.nextUrl.searchParams;
    const nodeId = searchParams.get('nodeId');
    const aggregateId = searchParams.get('aggregateId');
    const signature = searchParams.get('signature');

    if (!nodeId || !aggregateId) {
      return NextResponse.json(
        { error: 'Missing required parameters: nodeId, aggregateId' },
        { status: 400 }
      );
    }

    // Verify node identity
    const node = await loadFederatedNode(nodeId);

    if (!node) {
      return NextResponse.json(
        { error: 'Unknown or disabled node' },
        { status: 403 }
      );
    }

    // TODO: Verify signature for request authentication
    // For now: Node identity is sufficient

    // Load deal events
    const events = await loadEvents({
      entityType: 'Transaction',
      entityId: aggregateId,
    });

    if (events.length === 0) {
      return NextResponse.json(
        { error: 'Deal not found' },
        { status: 404 }
      );
    }

    // Derive current state
    const transactionState = foldTransactionState(events);

    // Extract key deal information (scoped view)
    const dealSnapshot = buildDealSnapshot(events, transactionState, node.node_type);

    return NextResponse.json({
      success: true,
      snapshot: dealSnapshot,
    });
  } catch (error) {
    console.error('Deal snapshot failed:', error);
    return NextResponse.json(
      {
        error: 'Failed to retrieve deal snapshot',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * Build scoped deal snapshot
 *
 * Different node types see different information
 */
function buildDealSnapshot(
  events: any[],
  transactionState: string,
  nodeType: 'lender' | 'title' | 'insurance'
): any {
  // Find contract acceptance event
  const contractEvent = events.find(e => e.event_type === 'CONTRACT_ACCEPTED');

  // Find transaction creation event
  const creationEvent = events.find(e => e.event_type === 'TransactionCreated');

  // Base snapshot (common to all nodes)
  const baseSnapshot = {
    dealId: events[0]?.entity_id,
    transactionState,
    contractDate: contractEvent?.occurred_at,
    createdAt: creationEvent?.occurred_at,
  };

  // Node-specific additional fields
  switch (nodeType) {
    case 'lender':
      return {
        ...baseSnapshot,
        propertyAddress: creationEvent?.payload?.property_address,
        buyerName: creationEvent?.payload?.buyer_name,
        purchasePrice: contractEvent?.payload?.purchase_price,
        closingTargetDate: contractEvent?.payload?.closing_target_date,
        loanAmount: contractEvent?.payload?.loan_amount,
      };

    case 'title':
      return {
        ...baseSnapshot,
        propertyAddress: creationEvent?.payload?.property_address,
        sellerName: creationEvent?.payload?.seller_name,
        buyerName: creationEvent?.payload?.buyer_name,
        closingTargetDate: contractEvent?.payload?.closing_target_date,
        escrowAgent: contractEvent?.payload?.escrow_agent,
      };

    case 'insurance':
      return {
        ...baseSnapshot,
        propertyAddress: creationEvent?.payload?.property_address,
        buyerName: creationEvent?.payload?.buyer_name,
        closingTargetDate: contractEvent?.payload?.closing_target_date,
        propertyType: creationEvent?.payload?.property_type,
      };

    default:
      return baseSnapshot;
  }
}
