import 'dotenv/config';
import * as path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Route imports
import identifyRouter from './routes/identify.js';
import metadataRouter from './routes/metadata.js';
import playlistRouter from './routes/playlist.js';
import coversRouter from './routes/covers.js';
import lyricsRouter from './routes/lyrics.js';
import uploadCoverRouter from './routes/uploadCover.js';
import imageProxyRouter from './routes/imageProxy.js';
import subscriptionRouter from './routes/subscription.js';
import checkoutRouter from './routes/checkout.js';
import pricesRouter from './routes/prices.js';
import stripeWebhookRouter from './routes/stripeWebhook.js';
import customerPortalRouter from './routes/customerPortal.js';
import adminRouter from './routes/admin.js';
import blogRouter from './routes/blog.js';
import gearRouter from './routes/gear.js';
import identifyGearRouter from './routes/identifyGear.js';
import findManualRouter from './routes/findManual.js';
import setupGuideRouter from './routes/setupGuide.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Security headers
app.use(helmet());

// CORS — use ALLOWED_ORIGINS env var (comma-separated), fallback to localhost
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()).filter(Boolean)
  : ['http://localhost:5173'];

app.use(cors({
  origin(origin, callback) {
    // Allow requests with no origin (e.g. curl, server-to-server)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type'],
}));

// Stripe webhook needs raw body for signature verification — mount BEFORE json parser
app.use('/api/stripe-webhook', express.raw({ type: 'application/json' }));
app.use(stripeWebhookRouter);

// Parse JSON bodies (10mb limit for base64 image payloads) — after webhook route
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// API routes
app.use(identifyRouter);
app.use(metadataRouter);
app.use(playlistRouter);
app.use(coversRouter);
app.use(lyricsRouter);
app.use(uploadCoverRouter);
app.use(imageProxyRouter);
app.use(subscriptionRouter);
app.use(checkoutRouter);
app.use(customerPortalRouter);
app.use(pricesRouter);
app.use(adminRouter);
app.use(blogRouter);
app.use(gearRouter);
app.use(identifyGearRouter);
app.use(findManualRouter);
app.use(setupGuideRouter);

// Ensure gear-photos storage bucket exists
async function ensureGearPhotosBucket() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return;

  const { createClient } = await import('@supabase/supabase-js');
  const admin = createClient(url, key);

  const { data: buckets } = await admin.storage.listBuckets();
  const exists = buckets?.some((b: { name: string }) => b.name === 'gear-photos');

  if (!exists) {
    const { error } = await admin.storage.createBucket('gear-photos', { public: true });
    if (error) {
      console.error('Failed to create gear-photos bucket:', error.message);
    } else {
      console.log('Created gear-photos storage bucket');
    }
  }
}

ensureGearPhotosBucket().catch(err =>
  console.error('gear-photos bucket check failed:', err)
);

// Serve static files from the Vite build output
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));

// SPA fallback — serve index.html for all non-API routes so React Router handles client-side routing
app.get('/{*splat}', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
