import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

// Route Imports
import productRoutes from './routes/productRoutes.js';
import userRoutes from './routes/userRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import supportRoutes from './routes/supportRoutes.js';
import shippingRoutes from './routes/shippingRoutes.js';
import catalogRoutes from './routes/catalogRoutes.js';
import dbRoutes from './routes/dbRoutes.js';

const app = express();

// Rate Limiting (Security - Defense-in-depth)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 150, // limit each IP to 150 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests from this IP, please try again after 15 minutes' },
});

// Stricter rate limiting on sensitive authentication and payment initiation endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requests per 15 minutes to thwart brute-force & credential stuffing
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many authentication attempts. Please try again after 15 minutes.' },
});

const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 order creation attempts per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many payment creation requests. Please try again later.' },
});

app.use('/api/', apiLimiter);
app.use('/api/users/', authLimiter);
app.use('/api/payment/create-order', paymentLimiter);

// Standard Middlewares
app.set('trust proxy', 1);

// Security Headers (Defense-in-depth & Strict HTTPS enforcement)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(self)');
  res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  
  // Enforce HTTPS in production environments behind proxies (e.g. Render/Vercel)
  if (process.env.NODE_ENV === 'production' && req.headers['x-forwarded-proto'] && req.headers['x-forwarded-proto'] !== 'https') {
    return res.redirect(301, `https://${req.headers.host}${req.url}`);
  }
  
  next();
});

// Logging suspicious activity (anomalous headers, traversal attempts, malformed inputs)
app.use((req, res, next) => {
  const url = req.originalUrl || req.url;
  const isSuspicious = /(\.\.[\/\\]|wp-login|eval\(|<script|select.*from|<.*>)/i.test(url);
  if (isSuspicious) {
    console.warn(`[SECURITY ALERT] Suspicious request detected from IP ${req.ip} targeting ${url} at ${new Date().toISOString()}`);
  }
  next();
});

// Allowed CORS origins (production storefronts + localhost dev)
const ALLOWED_ORIGINS = [
  'https://www.thejerseyvault.in',
  'https://thejerseyvault.in',
  'https://jersey-vault.vercel.app',
  'http://localhost:3000',
  'http://localhost:5000',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5000',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g. mobile apps, curl, server-to-server) or approved origins
    if (!origin || ALLOWED_ORIGINS.includes(origin) || origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    return callback(new Error('Blocked by CORS policy'));
  },
  credentials: true,
}));

// Raw body for Razorpay webhook signature verification (must be before express.json)
app.use('/api/payment/webhook', express.raw({ type: 'application/json' }));

app.use(express.json());

// API Routes
app.use('/api/products', productRoutes);
app.use('/api/catalog', catalogRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/shipping', shippingRoutes);
app.use('/api/db', dbRoutes);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const buildPath = path.resolve(__dirname, '../../client/build');

if (fs.existsSync(buildPath)) {
  app.use(express.static(buildPath, {
    maxAge: '1y',
    immutable: true,
    setHeaders: (res, filePath) => {
      if (!filePath.endsWith('index.html')) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    },
  }));

  app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
      return next();
    }
    res.sendFile(path.join(buildPath, 'index.html'));
  });
}

// Test Route
app.get('/api/test', (req, res) => {
  res.status(200).json({ message: 'API is running successfully!' });
});

// Global Error Handling Middleware
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  console.error('Global Error:', err);
  res.status(statusCode).json({
    message: 'An unexpected error occurred.',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
