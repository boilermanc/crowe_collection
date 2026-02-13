import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = {
  maxDuration: 15,
};

const USER_AGENT = 'TheCroweCollection/1.0';
const LRCLIB_BASE = 'https://lrclib.net/api';

function cleanTrackName(track: string): string {
  // Strip leading numbers like "1. ", "03 - ", "12. ", "1 - ", etc.
  return track.replace(/^\d+[\.\-\s]+\s*/, '').trim();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { artist, track, album } = req.body;
    if (!artist || !track || typeof artist !== 'string' || typeof track !== 'string') {
      return res.status(400).json({ error: 'Missing artist or track' });
    }

    const cleanedTrack = cleanTrackName(track);
    const headers = { 'User-Agent': USER_AGENT };

    // Try exact match first
    const params = new URLSearchParams({
      artist_name: artist,
      track_name: cleanedTrack,
    });
    if (album && typeof album === 'string') {
      params.set('album_name', album);
    }

    const exactResp = await fetch(`${LRCLIB_BASE}/get?${params}`, { headers });

    if (exactResp.ok) {
      const data = await exactResp.json();
      if (data && (data.plainLyrics || data.syncedLyrics)) {
        return res.status(200).json({
          lyrics: data.plainLyrics || null,
          syncedLyrics: data.syncedLyrics || null,
          source: 'lrclib-exact',
        });
      }
    }

    // Fallback: search endpoint
    const query = encodeURIComponent(`${artist} ${cleanedTrack}`);
    const searchResp = await fetch(`${LRCLIB_BASE}/search?q=${query}`, { headers });

    if (searchResp.ok) {
      const results = await searchResp.json();
      if (Array.isArray(results) && results.length > 0) {
        const best = results[0];
        return res.status(200).json({
          lyrics: best.plainLyrics || null,
          syncedLyrics: best.syncedLyrics || null,
          source: 'lrclib-search',
        });
      }
    }

    // No lyrics found
    return res.status(200).json({ lyrics: null, syncedLyrics: null, source: null });
  } catch (error) {
    console.error('Lyrics Fetch Error:', error);
    return res.status(500).json({ error: 'Failed to fetch lyrics' });
  }
}
