/**
 * MLS Sync API
 *
 * Triggers MLS listing sync.
 * Can be called manually or by cron job.
 */

import { NextRequest, NextResponse } from 'next/server';
import { syncMLSListings, reconcileMLSListings } from '@/lib/integrations/mls/syncMLSListings';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mlsSystem, listings } = body;

    if (!mlsSystem || !listings) {
      return NextResponse.json(
        { error: 'mlsSystem and listings are required' },
        { status: 400 }
      );
    }

    // Sync listings
    const syncResult = await syncMLSListings(mlsSystem, listings);

    // Auto-reconcile
    const matchedCount = await reconcileMLSListings();

    return NextResponse.json({
      success: true,
      sync: syncResult,
      reconciliation: { matched: matchedCount },
    });
  } catch (error) {
    console.error('MLS sync failed:', error);
    return NextResponse.json(
      {
        error: 'MLS sync failed',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
