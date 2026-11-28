import crypto from 'node:crypto';

export function safeEqualSha256Hex(expectedHex, providedHex) {
  if (typeof expectedHex !== 'string' || typeof providedHex !== 'string') return false;
  if (!/^[a-f0-9]{64}$/i.test(expectedHex) || !/^[a-f0-9]{64}$/i.test(providedHex)) return false;

  const expected = Buffer.from(expectedHex, 'hex');
  const provided = Buffer.from(providedHex, 'hex');
  return expected.length === provided.length && crypto.timingSafeEqual(expected, provided);
}

export function verifyRazorpayWebhookSignature(rawBody, signature, secret) {
  if (!Buffer.isBuffer(rawBody) || !secret) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  return safeEqualSha256Hex(expected, signature);
}

export function verifyRazorpayPaymentSignature(orderId, paymentId, signature, secret) {
  if (!orderId || !paymentId || !secret) return false;
  const expected = crypto.createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  return safeEqualSha256Hex(expected, signature);
}

export function isRazorpayPaymentCaptured(payment) {
  return payment?.status === 'captured';
}
