/**
 * Template Renderer
 *
 * Renders message templates with variable substitution.
 * Simple Mustache-style templating: {{variable}}
 */

export function renderTemplate(
  template: string,
  context: Record<string, any>
): string {
  let rendered = template;

  // Replace {{variable}} with context values
  for (const [key, value] of Object.entries(context)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    rendered = rendered.replace(regex, String(value ?? ''));
  }

  return rendered;
}

/**
 * Build context for template rendering from decision context
 */
export function buildTemplateContext(params: {
  decisionContext: any;
  dealId: string;
  additionalData?: Record<string, any>;
}): Record<string, any> {
  const { decisionContext, dealId, additionalData = {} } = params;

  return {
    property_address:
      decisionContext.transactionState?.propertyAddress || 'Unknown Property',
    closing_readiness: decisionContext.closingReadiness || 'unknown',
    blocking_reason: decisionContext.blockingReason || 'None',
    deal_url: `${process.env.NEXT_PUBLIC_APP_URL}/transactions/${dealId}/executive`,
    ...additionalData,
  };
}
