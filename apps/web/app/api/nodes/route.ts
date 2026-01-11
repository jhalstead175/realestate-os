/**
 * Federation Nodes API
 *
 * Returns the registry of active federation nodes with their public keys.
 * This enables public key discovery for signature verification.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const jurisdiction = searchParams.get('jurisdiction');
    const status = searchParams.get('status') || 'active';

    // Build query
    let query = supabaseServer
      .from('federation_nodes_with_reputation')
      .select('*')
      .eq('status', status);

    if (jurisdiction) {
      query = query.eq('jurisdiction', jurisdiction);
    }

    const { data: nodes, error } = await query;

    if (error) {
      console.error('Failed to query nodes:', error);
      return NextResponse.json(
        { error: 'Failed to retrieve nodes' },
        { status: 500 }
      );
    }

    // Return public information only
    return NextResponse.json({
      nodes: nodes.map((node) => ({
        node_id: node.node_id,
        brokerage_name: node.brokerage_name,
        jurisdiction: node.jurisdiction,
        public_key: node.public_key,
        policy_manifest_hash: node.policy_manifest_hash,
        reputation_score: node.reputation_score,
        created_at: node.created_at,
      })),
      total: nodes.length,
    });
  } catch (error) {
    console.error('Nodes query error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
