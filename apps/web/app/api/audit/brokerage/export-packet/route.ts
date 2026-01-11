/**
 * Multi-Deal Audit Packet Export
 *
 * Generates ZIP archive containing:
 * - Cover letter
 * - Individual PDF narratives for each deal
 * - Consolidated appendices (optional)
 *
 * Use Cases:
 * - Regulatory inquiry (multiple deals)
 * - Litigation discovery
 * - Board audit package
 * - Annual compliance review
 *
 * Demo Line: "We can generate a complete audit packet for all 50 deals in 60 seconds."
 */

import { NextRequest, NextResponse } from 'next/server';
import { buildDecisionContext } from '@/lib/execution';
import { generateAuditNarrative } from '@/lib/narrative/generateAuditNarrative';
import { renderNarrativeToPDF } from '@/lib/audit/renderNarrativeToPDF';
import { renderCoverLetter } from '@/lib/audit/renderCoverLetter';
import JSZip from 'jszip';

interface ExportPacketRequest {
  dealIds: string[];
  brokerageName: string;
  purpose?: string;
  recipient?: string;
  asOfDate?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ExportPacketRequest = await request.json();
    const {
      dealIds,
      brokerageName,
      purpose = 'Regulatory Inquiry',
      recipient,
      asOfDate,
    } = body;

    if (!dealIds || dealIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one deal ID is required' },
        { status: 400 }
      );
    }

    // Create ZIP archive
    const zip = new JSZip();

    // Generate cover letter
    const coverLetter = renderCoverLetter({
      brokerageName,
      date: new Date().toLocaleDateString(),
      dealCount: dealIds.length,
      purpose,
      recipient,
    });

    zip.file('00-COVER-LETTER.txt', coverLetter);

    // Generate PDF for each deal
    let successCount = 0;
    let failureCount = 0;

    for (let i = 0; i < dealIds.length; i++) {
      const dealId = dealIds[i];

      try {
        // Build decision context
        const decisionContext = await buildDecisionContext({
          actorId: 'AUDIT_PACKET_GENERATOR',
          transactionId: dealId,
        });

        // Generate narrative
        const narrative = await generateAuditNarrative({
          decisionContext,
          dealId,
          purpose,
        });

        // Render PDF
        const pdfBuffer = await renderNarrativeToPDF(narrative);

        // Add to ZIP with numbered prefix
        const fileNumber = String(i + 1).padStart(2, '0');
        zip.file(`${fileNumber}-Deal-${dealId}.pdf`, pdfBuffer);

        successCount++;
      } catch (error) {
        console.error(`Failed to generate PDF for deal ${dealId}:`, error);
        failureCount++;

        // Add error note to ZIP
        const errorNote = `Failed to generate narrative for Deal ${dealId}\n\nError: ${
          error instanceof Error ? error.message : String(error)
        }`;
        zip.file(`${String(i + 1).padStart(2, '0')}-Deal-${dealId}-ERROR.txt`, errorNote);
      }
    }

    // Add summary file
    const summary = `AUDIT PACKET SUMMARY
${'='.repeat(80)}

Brokerage: ${brokerageName}
Purpose: ${purpose}
Generated: ${new Date().toLocaleString()}
${asOfDate ? `As-of Date: ${asOfDate}` : ''}

Total Deals Requested: ${dealIds.length}
Successfully Generated: ${successCount}
Failed: ${failureCount}

${'='.repeat(80)}

This audit packet was generated from the RealEstate-OS system of record.
All narratives are deterministic and reproducible from the canonical event log.
`;

    zip.file('01-SUMMARY.txt', summary);

    // Generate ZIP buffer
    const zipBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 },
    });

    // Return ZIP
    const filename = `${brokerageName.replace(/\s+/g, '-')}-Audit-Packet-${new Date().toISOString().split('T')[0]}.zip`;

    return new NextResponse(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Audit packet generation failed:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate audit packet',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
