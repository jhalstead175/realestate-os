/**
 * CRM Sync API
 *
 * Triggers CRM listing sync.
 * Can be called manually or by cron job.
 */

import { NextRequest, NextResponse } from 'next/server';
import { syncCRMListings, reconcileCRMListings } from '@/lib/integrations/crm/syncCRMListings';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { crmSystem, listings } = body;

    if (!crmSystem || !listings) {
      return NextResponse.json(
        { error: 'crmSystem and listings are required' },
        { status: 400 }
      );
    }

    // Sync listings
    const syncResult = await syncCRMListings(crmSystem, listings);

    // Auto-reconcile
    const matchedCount = await reconcileCRMListings();

    return NextResponse.json({
      success: true,
      sync: syncResult,
      reconciliation: { matched: matchedCount },
    });
  } catch (error) {
    console.error('CRM sync failed:', error);
    return NextResponse.json(
      {
        error: 'CRM sync failed',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
