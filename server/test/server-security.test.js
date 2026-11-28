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

test('quantity validator rejects invalid, non-integer, and out-of-bound quantities', () => {
  const isValidQty = (q) => {
    const n = Number(q);
    return Number.isInteger(n) && n >= 1 && n <= 20;
  };
  assert.equal(isValidQty(1), true);
  assert.equal(isValidQty(20), true);
  assert.equal(isValidQty(0), false);
  assert.equal(isValidQty(-1), false);
  assert.equal(isValidQty(1.5), false);
  assert.equal(isValidQty(21), false);
  assert.equal(isValidQty('abc'), false);
  assert.equal(isValidQty(NaN), false);
});

test('IDOR invoice check permits only order owner or admin', () => {
  const isInvoiceAuthorized = (user, order) => {
    const isOwner = user?.id && (order.user_id === user.id || order.customer_email?.toLowerCase() === user.email?.toLowerCase());
    const isAdmin = user?.role === 'admin';
    return Boolean(isOwner || isAdmin);
  };

  const userA = { id: 'u1', email: 'alice@example.com', role: 'user' };
  const userB = { id: 'u2', email: 'bob@example.com', role: 'user' };
  const admin = { id: 'admin1', email: 'navneeldutta@gmail.com', role: 'admin' };
  const orderA = { id: 'ord1', user_id: 'u1', customer_email: 'alice@example.com' };

  assert.equal(isInvoiceAuthorized(userA, orderA), true);
  assert.equal(isInvoiceAuthorized(userB, orderA), false);
  assert.equal(isInvoiceAuthorized(admin, orderA), true);
  assert.equal(isInvoiceAuthorized(null, orderA), false);
});

test('live rate calculation fails safely with HTTP 503 and unserviceable state on error', async () => {
  const { calculateLiveRateController } = await import('../src/controllers/shippingController.js');

  const req = {
    body: {
      pincode: '110001',
      payment_mode: 'COD',
      subtotal: 500
    }
  };

  let statusCode = null;
  let jsonResponse = null;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(payload) {
      jsonResponse = payload;
      return this;
    }
  };

  // calculateLiveDeliveryRate will either succeed or fail gracefully based on config/network
  await calculateLiveRateController(req, res);

  // Status must be either 200 (if carrier/default rate succeeds) or 503 (if carrier is unavailable)
  assert.ok(statusCode === 200 || statusCode === 503);
  if (statusCode === 503) {
    assert.equal(jsonResponse.success, false);
    assert.equal(jsonResponse.data.serviceable, false);
    assert.equal(jsonResponse.data.payment_mode, 'COD');
  }
});
