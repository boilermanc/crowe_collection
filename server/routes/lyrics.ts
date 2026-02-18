import { Router } from 'express';
import { requireAuthWithUser, type AuthResult } from '../middleware/auth.js';
import { validateStringLength } from '../middleware/validate.js';
import { USER_AGENT } from '../lib/constants.js';
import { requirePlan } from '../lib/subscription.js';

const LRCLIB_BASE = 'https://lrclib.net/api';

function cleanTrackName(track: string): string {
  // Strip leading numbers like "1. ", "03 - ", "12. ", "1 - ", etc.
  return track.replace(/^\d+[\.\-\s]+\s*/, '').trim();
}

const router = Router();

router.post(
  '/api/lyrics',
  requireAuthWithUser,
  async (req, res) => {
    const { userId } = (req as typeof req & { auth: AuthResult }).auth;

    // Curator+ only
    const sub = await requirePlan(userId, 'curator', res);
    if (!sub) return;

    try {
      const { artist, track, album } = req.body;
      if (!artist || !track || typeof artist !== 'string' || typeof track !== 'string') {
        res.status(400).json({ error: 'Missing artist or track' });
        return;
      }

      const artistErr = validateStringLength(artist, 500, 'artist');
      if (artistErr) { res.status(400).json({ error: artistErr }); return; }
      const trackErr = validateStringLength(track, 500, 'track');
      if (trackErr) { res.status(400).json({ error: trackErr }); return; }
      if (album != null) {
        const albumErr = validateStringLength(album, 500, 'album');
        if (albumErr) { res.status(400).json({ error: albumErr }); return; }
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
          res.status(200).json({
            lyrics: data.plainLyrics || null,
            syncedLyrics: data.syncedLyrics || null,
            source: 'lrclib-exact',
          });
          return;
        }
      }

      // Fallback: search endpoint
      const query = encodeURIComponent(`${artist} ${cleanedTrack}`);
      const searchResp = await fetch(`${LRCLIB_BASE}/search?q=${query}`, { headers });

      if (searchResp.ok) {
        const results = await searchResp.json();
        if (Array.isArray(results) && results.length > 0) {
          const best = results[0];
          res.status(200).json({
            lyrics: best.plainLyrics || null,
            syncedLyrics: best.syncedLyrics || null,
            source: 'lrclib-search',
          });
          return;
        }
      }

      // No lyrics found
      res.status(200).json({ lyrics: null, syncedLyrics: null, source: null });
    } catch (error) {
      console.error('Lyrics Fetch Error:', error);
      res.status(500).json({ error: 'Failed to fetch lyrics' });
    }
  }
);

export default router;
