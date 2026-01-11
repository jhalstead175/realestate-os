/**
 * Email Provider
 *
 * Stub implementation for email delivery.
 * In production, integrate with SendGrid, Postmark, AWS SES, etc.
 */

interface EmailParams {
  recipients: string[];
  body: string;
  templateId: string;
}

/**
 * Send email
 *
 * @returns Provider message ID for tracking
 */
export async function sendEmail(params: EmailParams): Promise<string> {
  const { recipients, body, templateId } = params;

  console.log('===== EMAIL DELIVERY (STUB) =====');
  console.log('Template:', templateId);
  console.log('Recipients:', recipients.join(', '));
  console.log('Body:', body);
  console.log('=================================');

  // TODO: Integrate with real email provider
  // Example with SendGrid:
  // const response = await sendGridClient.send({
  //   to: recipients,
  //   from: 'notifications@realestate-os.com',
  //   subject: extractSubject(templateId),
  //   text: body,
  // });
  // return response.messageId;

  // For now, return mock message ID
  return `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Real implementation example (SendGrid):
 *
 * import sgMail from '@sendgrid/mail';
 *
 * sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
 *
 * export async function sendEmail(params: EmailParams): Promise<string> {
 *   const msg = {
 *     to: params.recipients,
 *     from: 'notifications@realestate-os.com',
 *     subject: extractSubjectFromTemplate(params.templateId),
 *     text: params.body,
 *   };
 *
 *   const [response] = await sgMail.send(msg);
 *   return response.headers['x-message-id'];
 * }
 */
