/**
 * Audit Narrative API
 *
 * Generates deterministic audit narratives for:
 * - Regulatory inquiries
 * - Litigation discovery
 * - Board reviews
 * - Post-mortems
 *
 * Returns both structured JSON and formatted text.
 */

import { NextRequest, NextResponse } from 'next/server';
import { buildDecisionContext } from '@/lib/execution';
import { generateAuditNarrative, formatNarrativeAsText } from '@/lib/narrative/generateAuditNarrative';

export async function GET(
  request: NextRequest,
  { params }: { params: { dealId: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const purpose = searchParams.get('purpose') || 'Executive Review';
    const format = searchParams.get('format') || 'json'; // 'json' or 'text'

    // Build decision context (single source of truth)
    const decisionContext = await buildDecisionContext({
      actorId: 'AUDIT_GENERATOR',
      transactionId: params.dealId,
    });

    // Generate narrative
    const narrative = await generateAuditNarrative({
      decisionContext,
      dealId: params.dealId,
      purpose,
    });

    // Return in requested format
    if (format === 'text') {
      const text = formatNarrativeAsText(narrative);

      return new NextResponse(text, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': `attachment; filename="audit-narrative-${params.dealId}.txt"`,
        },
      });
    }

    // Default: JSON
    return NextResponse.json({
      success: true,
      narrative,
    });
  } catch (error) {
    console.error('Audit narrative generation failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate audit narrative',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
