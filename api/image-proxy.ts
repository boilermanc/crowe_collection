import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = {
  maxDuration: 15,
};

const ALLOWED_HOSTS = [
  'img.discogs.com',
  'i.discogs.com',
  'coverartarchive.org',
  'images.unsplash.com',
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
        'User-Agent': 'CroweCollection/1.0',
        'Accept': 'image/*',
      },
    });

    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: 'Upstream fetch failed' });
    }

    const contentType = upstream.headers.get('content-type') || 'image/jpeg';
    const buffer = Buffer.from(await upstream.arrayBuffer());

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800');
    return res.status(200).send(buffer);
  } catch (error) {
    console.error('Image proxy error:', error);
    return res.status(502).json({ error: 'Failed to fetch image' });
  }
}
