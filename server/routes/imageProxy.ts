import { Router } from 'express';
import { USER_AGENT } from '../lib/constants.js';

const ALLOWED_HOSTS = [
  'img.discogs.com',
  'i.discogs.com',
  'coverartarchive.org',
  'images.unsplash.com',
];

const router = Router();

// Auth intentionally skipped: this endpoint is called via <img> src attributes in the
// browser, which cannot attach Authorization headers. Security is enforced by the
// ALLOWED_HOSTS allowlist above, which restricts proxying to known image CDNs only.
router.get('/api/image-proxy', async (req, res) => {
  const { url } = req.query;

  if (!url || typeof url !== 'string') {
    res.status(400).json({ error: 'Missing url parameter' });
    return;
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    res.status(400).json({ error: 'Invalid URL' });
    return;
  }

  if (!ALLOWED_HOSTS.some(host => parsed.hostname === host || parsed.hostname.endsWith('.' + host))) {
    res.status(403).json({ error: 'Host not allowed' });
    return;
  }

  try {
    const upstream = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'image/*',
      },
    });

    if (!upstream.ok) {
      res.status(upstream.status).json({ error: 'Upstream fetch failed' });
      return;
    }

    const contentType = upstream.headers.get('content-type');
    if (!contentType || !contentType.startsWith('image/')) {
      res.status(502).json({ error: 'Upstream returned non-image content type' });
      return;
    }

    const buffer = Buffer.from(await upstream.arrayBuffer());

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800');
    res.status(200).send(buffer);
  } catch (error) {
    console.error('Image proxy error:', error);
    res.status(502).json({ error: 'Failed to fetch image' });
  }
});

export default router;
