/**
 * Cover Letter Renderer
 *
 * Generates formal cover letter for multi-deal audit packets.
 * Used when submitting to regulators, courts, or auditors.
 *
 * Professional, conservative tone.
 */

export interface CoverLetterParams {
  brokerageName: string;
  date: string;
  dealCount: number;
  purpose: string;
  recipient?: string;
}

/**
 * Render plain-text cover letter
 */
export function renderCoverLetter({
  brokerageName,
  date,
  dealCount,
  purpose,
  recipient,
}: CoverLetterParams): string {
  const lines: string[] = [];

  lines.push(`${brokerageName}`);
  lines.push(`${date}`);
  lines.push('');

  if (recipient) {
    lines.push(`${recipient}`);
    lines.push('');
  }

  lines.push(`Re: ${purpose}`);
  lines.push('');
  lines.push('Dear Sir or Madam,');
  lines.push('');

  lines.push(
    `This packet is submitted on behalf of ${brokerageName} as an official record ` +
    `of transaction activity. Each enclosed narrative is generated directly from the ` +
    `system of record and reflects the state of each transaction as-of the specified date.`
  );
  lines.push('');

  lines.push(
    `The enclosed packet contains ${dealCount} transaction ${dealCount === 1 ? 'narrative' : 'narratives'}, ` +
    `each with complete event history, authority chain, and closing readiness determination.`
  );
  lines.push('');

  lines.push('Key characteristics of these narratives:');
  lines.push('');
  lines.push('1. DETERMINISTIC GENERATION');
  lines.push('   Each narrative is generated directly from the immutable event log.');
  lines.push('   Any authorized party can reproduce these exact conclusions by replaying the events.');
  lines.push('');

  lines.push('2. CRYPTOGRAPHIC VERIFICATION');
  lines.push('   All federated assertions (from lenders, title companies, insurance providers)');
  lines.push('   are cryptographically signed. Event IDs are traceable to the canonical log.');
  lines.push('');

  lines.push('3. COMPLETE AUDIT TRAIL');
  lines.push('   Every action is attributed to a specific actor with derived authority.');
  lines.push('   Authority grants and revocations are tracked as first-class events.');
  lines.push('');

  lines.push('4. TIME-TRAVEL CAPABILITY');
  lines.push('   Each narrative can be regenerated for any historical point in time,');
  lines.push('   showing the exact state of the transaction as it existed at that moment.');
  lines.push('');

  lines.push(
    `Should you require additional information, clarification, or verification of any ` +
    `event or assertion contained in these narratives, please do not hesitate to contact us.`
  );
  lines.push('');

  lines.push('Respectfully submitted,');
  lines.push('');
  lines.push(`${brokerageName}`);
  lines.push(`Generated: ${date}`);
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('VERIFICATION NOTICE:');
  lines.push('All event IDs listed in the appendices can be verified against the');
  lines.push('canonical event log maintained by the RealEstate-OS system of record.');
  lines.push('All federated document hashes can be verified against source documents.');

  return lines.join('\n');
}

/**
 * Render HTML cover letter (for PDF embedding)
 */
export function renderCoverLetterHTML({
  brokerageName,
  date,
  dealCount,
  purpose,
  recipient,
}: CoverLetterParams): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: 'Times New Roman', serif;
      font-size: 12pt;
      line-height: 1.5;
      max-width: 7in;
      margin: 1in;
    }
    .header {
      margin-bottom: 2em;
    }
    .section {
      margin-bottom: 1.5em;
    }
    .indent {
      margin-left: 2em;
    }
    .signature {
      margin-top: 3em;
    }
    .notice {
      margin-top: 2em;
      padding-top: 1em;
      border-top: 1px solid #ccc;
      font-size: 10pt;
    }
  </style>
</head>
<body>
  <div class="header">
    <p><strong>${brokerageName}</strong></p>
    <p>${date}</p>
    ${recipient ? `<p><br/>${recipient}</p>` : ''}
  </div>

  <div class="section">
    <p><strong>Re: ${purpose}</strong></p>
  </div>

  <div class="section">
    <p>Dear Sir or Madam,</p>
  </div>

  <div class="section">
    <p>
      This packet is submitted on behalf of ${brokerageName} as an official record
      of transaction activity. Each enclosed narrative is generated directly from the
      system of record and reflects the state of each transaction as-of the specified date.
    </p>
  </div>

  <div class="section">
    <p>
      The enclosed packet contains ${dealCount} transaction ${dealCount === 1 ? 'narrative' : 'narratives'},
      each with complete event history, authority chain, and closing readiness determination.
    </p>
  </div>

  <div class="section">
    <p><strong>Key characteristics of these narratives:</strong></p>

    <div class="indent">
      <p><strong>1. DETERMINISTIC GENERATION</strong><br/>
      Each narrative is generated directly from the immutable event log.
      Any authorized party can reproduce these exact conclusions by replaying the events.</p>

      <p><strong>2. CRYPTOGRAPHIC VERIFICATION</strong><br/>
      All federated assertions (from lenders, title companies, insurance providers)
      are cryptographically signed. Event IDs are traceable to the canonical log.</p>

      <p><strong>3. COMPLETE AUDIT TRAIL</strong><br/>
      Every action is attributed to a specific actor with derived authority.
      Authority grants and revocations are tracked as first-class events.</p>

      <p><strong>4. TIME-TRAVEL CAPABILITY</strong><br/>
      Each narrative can be regenerated for any historical point in time,
      showing the exact state of the transaction as it existed at that moment.</p>
    </div>
  </div>

  <div class="section">
    <p>
      Should you require additional information, clarification, or verification of any
      event or assertion contained in these narratives, please do not hesitate to contact us.
    </p>
  </div>

  <div class="signature">
    <p>Respectfully submitted,</p>
    <p><br/><strong>${brokerageName}</strong><br/>
    Generated: ${date}</p>
  </div>

  <div class="notice">
    <p><strong>VERIFICATION NOTICE:</strong></p>
    <p>
      All event IDs listed in the appendices can be verified against the
      canonical event log maintained by the RealEstate-OS system of record.
      All federated document hashes can be verified against source documents.
    </p>
  </div>
</body>
</html>
  `.trim();
}
