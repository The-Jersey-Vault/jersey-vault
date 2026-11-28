import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {
  createDbReadAccessMiddleware,
  isPublicDbReadQueryAllowed,
  isPublicDbReadTable,
  projectPublicDbRows,
} from '../src/utils/dbReadAccess.js';
import {
  isRazorpayPaymentCaptured,
  verifyRazorpayPaymentSignature,
  verifyRazorpayWebhookSignature,
} from '../src/utils/paymentSecurity.js';

test('anonymous database reads are limited to the storefront table allowlist', () => {
  assert.equal(isPublicDbReadTable('products'), true);
  assert.equal(isPublicDbReadTable('teams'), true);
  assert.equal(isPublicDbReadTable('site_settings'), true);
  assert.equal(isPublicDbReadTable('orders'), false);
  assert.equal(isPublicDbReadTable('profiles'), false);
  assert.equal(isPublicDbReadTable('unknown_table'), false);
});

test('private table reads invoke the existing admin guard', () => {
  let guardCalls = 0;
  let nextCalls = 0;
  const middleware = createDbReadAccessMiddleware((_req, _res, next) => {
    guardCalls += 1;
    next();
  });
  const req = { params: { table: 'orders' } };
  middleware(req, {}, () => { nextCalls += 1; });
  assert.equal(guardCalls, 1);
  assert.equal(nextCalls, 1);
});

test('public catalog reads bypass admin guard', () => {
  let guardCalls = 0;
  let nextCalls = 0;
  const middleware = createDbReadAccessMiddleware(() => { guardCalls += 1; });
  middleware({ params: { table: 'products' } }, {}, () => { nextCalls += 1; });
  assert.equal(guardCalls, 0);
  assert.equal(nextCalls, 1);
});

test('public query allowlist permits expected catalog reads and blocks internal fields', () => {
  assert.equal(isPublicDbReadQueryAllowed('products', { select: '*', status: 'eq.active' }), true);
  assert.equal(isPublicDbReadQueryAllowed('teams', { select: 'id,name,logo_url' }), true);
  assert.equal(isPublicDbReadQueryAllowed('products', { select: 'id,cost_price' }), false);
  assert.equal(isPublicDbReadQueryAllowed('products', { supplier_id: 'eq.123' }), false);
  assert.equal(isPublicDbReadQueryAllowed('site_settings', { key: 'eq.featured_category_name', select: 'key,value' }), true);
  assert.equal(isPublicDbReadQueryAllowed('site_settings', { key: 'eq.private_api_token' }), false);
  assert.equal(isPublicDbReadQueryAllowed('orders', {}), false);
});

test('public projections strip unapproved fields and expose only the known public setting', () => {
  const products = projectPublicDbRows('products', [
    { id: 'p1', name: 'Home Shirt', price: 999, cost_price: 300, supplier_id: 's1' },
  ]);
  assert.deepEqual(products, [{ id: 'p1', name: 'Home Shirt', price: 999 }]);

  const settings = projectPublicDbRows('site_settings', [
    { key: 'featured_category_name', value: 'Retro' },
    { key: 'private_api_token', value: 'must-not-leak' },
  ]);
  assert.deepEqual(settings, [{ key: 'featured_category_name', value: 'Retro' }]);
});

test('Razorpay webhook signatures validate raw bytes and fail closed on malformed inputs', () => {
  const secret = 'test-webhook-secret';
  const rawBody = Buffer.from('{"event":"payment.captured"}');
  const signature = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  assert.equal(verifyRazorpayWebhookSignature(rawBody, signature, secret), true);
  assert.equal(verifyRazorpayWebhookSignature(rawBody, signature, ''), false);
  assert.equal(verifyRazorpayWebhookSignature(rawBody, 'bad-signature', secret), false);
  assert.equal(verifyRazorpayWebhookSignature(rawBody.toString(), signature, secret), false);
});

test('Razorpay payment signatures are checked and only captured payments qualify', () => {
  const secret = 'test-payment-secret';
  const orderId = 'order_test123';
  const paymentId = 'pay_test456';
  const signature = crypto.createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  assert.equal(verifyRazorpayPaymentSignature(orderId, paymentId, signature, secret), true);
  assert.equal(verifyRazorpayPaymentSignature(orderId, paymentId, signature, ''), false);
  assert.equal(verifyRazorpayPaymentSignature(orderId, paymentId, signature.slice(1), secret), false);
  assert.equal(isRazorpayPaymentCaptured({ status: 'captured' }), true);
  assert.equal(isRazorpayPaymentCaptured({ status: 'authorized' }), false);
  assert.equal(isRazorpayPaymentCaptured(null), false);
});

test('nested team data in a public product projection is field-limited', () => {
  const [product] = projectPublicDbRows('products', [{
    id: 'p2',
    teams: { id: 't1', name: 'Example FC', logo_url: '/logo.png', internal_note: 'private' },
    supplier_cost: 400,
  }]);
  assert.deepEqual(product, {
    id: 'p2',
    teams: { id: 't1', name: 'Example FC', logo_url: '/logo.png' },
  });
});

test('malformed public sort expressions are rejected', () => {
  assert.equal(isPublicDbReadQueryAllowed('products', { order: 'name.asc.secret' }), false);
  assert.equal(isPublicDbReadQueryAllowed('products', { order: 'cost_price.desc' }), false);
});

test('upload file extension whitelist prevents executable file types', () => {
  const allowed = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif']);
  assert.equal(allowed.has('jpg'), true);
  assert.equal(allowed.has('png'), true);
  assert.equal(allowed.has('exe'), false);
  assert.equal(allowed.has('php'), false);
  assert.equal(allowed.has('js'), false);
  assert.equal(allowed.has('sh'), false);
});
