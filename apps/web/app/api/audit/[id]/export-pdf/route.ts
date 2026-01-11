/**
 * PDF Export API
 *
 * Server-side PDF generation (deterministic, no UI state)
 *
 * Demo Moment: "We can hand this to a regulator. Today."
 */

import { NextRequest, NextResponse } from 'next/server';
import { buildDecisionContext } from '@/lib/execution';
import { generateAuditNarrative } from '@/lib/narrative/generateAuditNarrative';
import { renderNarrativeToPDF } from '@/lib/audit/renderNarrativeToPDF';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const dealId = params.id;

    // Build decision context (single source of truth)
    const decisionContext = await buildDecisionContext({
      actorId: 'PDF_GENERATOR',
      transactionId: dealId,
    });

    // Generate narrative
    const narrative = await generateAuditNarrative({
      decisionContext,
      dealId,
      purpose: 'Regulatory Inquiry',
    });

    // Render to PDF
    const pdfBuffer = await renderNarrativeToPDF(narrative);

    // Return PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Audit-Narrative-${dealId}.pdf"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('PDF export failed:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate PDF',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
