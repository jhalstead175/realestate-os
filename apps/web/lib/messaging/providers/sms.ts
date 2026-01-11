/**
 * SMS Provider
 *
 * Stub implementation for SMS delivery.
 * In production, integrate with Twilio, AWS SNS, etc.
 */

interface SMSParams {
  recipients: string[]; // Phone numbers
  body: string;
}

/**
 * Send SMS
 *
 * @returns Provider message ID for tracking
 */
export async function sendSMS(params: SMSParams): Promise<string> {
  const { recipients, body } = params;

  console.log('===== SMS DELIVERY (STUB) =====');
  console.log('Recipients:', recipients.join(', '));
  console.log('Body:', body);
  console.log('===============================');

  // TODO: Integrate with real SMS provider
  // Example with Twilio:
  // const response = await twilioClient.messages.create({
  //   to: recipient,
  //   from: process.env.TWILIO_PHONE_NUMBER,
  //   body,
  // });
  // return response.sid;

  // For now, return mock message ID
  return `sms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Real implementation example (Twilio):
 *
 * import twilio from 'twilio';
 *
 * const client = twilio(
 *   process.env.TWILIO_ACCOUNT_SID,
 *   process.env.TWILIO_AUTH_TOKEN
 * );
 *
 * export async function sendSMS(params: SMSParams): Promise<string> {
 *   // Twilio sends one message per recipient
 *   const messages = await Promise.all(
 *     params.recipients.map((recipient) =>
 *       client.messages.create({
 *         to: recipient,
 *         from: process.env.TWILIO_PHONE_NUMBER,
 *         body: params.body,
 *       })
 *     )
 *   );
 *
 *   // Return first message SID (or aggregate if needed)
 *   return messages[0].sid;
 * }
 */
