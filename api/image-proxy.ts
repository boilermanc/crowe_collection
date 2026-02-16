import type { VercelRequest, VercelResponse } from '@vercel/node';
import { cors } from './_cors';
import { USER_AGENT } from './_constants';

export const config = {
  maxDuration: 15,
};

const ALLOWED_HOSTS = [
  'img.discogs.com',
  'i.discogs.com',
  'coverartarchive.org',
  'images.unsplash.com',
];

// Auth intentionally skipped: this endpoint is called via <img> src attributes in the
// browser, which cannot attach Authorization headers. Security is enforced by the
// ALLOWED_HOSTS allowlist above, which restricts proxying to known image CDNs only.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res, 'GET')) return;

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.query;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  if (!ALLOWED_HOSTS.some(host => parsed.hostname === host || parsed.hostname.endsWith('.' + host))) {
    return res.status(403).json({ error: 'Host not allowed' });
  }

  try {
    const upstream = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'image/*',
      },
    });

    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: 'Upstream fetch failed' });
    }

    const contentType = upstream.headers.get('content-type');
    if (!contentType || !contentType.startsWith('image/')) {
      return res.status(502).json({ error: 'Upstream returned non-image content type' });
    }

    const buffer = Buffer.from(await upstream.arrayBuffer());

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800');
    return res.status(200).send(buffer);
  } catch (error) {
    console.error('Image proxy error:', error);
    return res.status(502).json({ error: 'Failed to fetch image' });
  }
}
