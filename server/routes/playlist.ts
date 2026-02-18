import { Router } from 'express';
import { Type } from '@google/genai';
import { requireAuthWithUser, type AuthResult } from '../middleware/auth.js';
import { createRateLimit } from '../middleware/rateLimit.js';
import { validateStringLength } from '../middleware/validate.js';
import { sanitizePromptInput } from '../middleware/sanitize.js';
import { ai } from '../lib/gemini.js';
import { requirePlan } from '../lib/subscription.js';

interface PlaylistAlbumInput {
  id: string;
  artist: string;
  title: string;
  genre?: string;
  tags?: string[];
  tracklist?: string[];
}

interface RawPlaylistItem {
  albumId?: string;
  artist?: string;
  albumTitle?: string;
  itemTitle?: string;
}

const router = Router();

router.post(
  '/api/playlist',
  requireAuthWithUser,
  createRateLimit(10, 60),
  async (req, res) => {
    const { userId } = (req as typeof req & { auth: AuthResult }).auth;

    // Curator+ only
    const sub = await requirePlan(userId, 'curator', res);
    if (!sub) return;

    try {
      const { albums, mood: rawMood, type: rawType } = req.body;
      if (!Array.isArray(albums) || !rawMood || typeof rawMood !== 'string') {
        res.status(400).json({ error: 'Missing albums array or mood' });
        return;
      }

      const moodErr = validateStringLength(rawMood, 1000, 'mood');
      if (moodErr) { res.status(400).json({ error: moodErr }); return; }
      if (rawType != null) {
        const typeErr = validateStringLength(rawType, 50, 'type');
        if (typeErr) { res.status(400).json({ error: typeErr }); return; }
      }

      // Sanitize before prompt interpolation to prevent prompt injection
      const mood = sanitizePromptInput(rawMood, 1000);

      const type = ['album', 'side', 'song'].includes(rawType) ? rawType : 'song';
      const maxItems = type === 'album' ? 8 : type === 'side' ? 12 : 15;

      const MAX_ALBUMS = 200;
      const simplifiedCollection = albums.slice(0, MAX_ALBUMS).map((a: PlaylistAlbumInput) => ({
        id: a.id,
        artist: a.artist,
        title: a.title,
        genre: a.genre,
        tags: a.tags,
        tracklist: a.tracklist
      }));

      const typeInstructions: Record<string, string> = {
        album: 'Pick full albums to listen to front-to-back. itemTitle should be the album title. The listener will play the entire record.',
        side: 'Pick specific sides of vinyl records (Side A or Side B). itemTitle should be "Side A" or "Side B". This is for curating a listening session by vinyl sides.',
        song: 'Pick individual songs/tracks. itemTitle should be the actual song name. Use each album\'s tracklist data (if available) to pick real track names.'
      };

      const validIds = new Set(simplifiedCollection.map((a: PlaylistAlbumInput) => a.id));

      const prompt = `You are a strict playlist curator for a vinyl record collection. The user wants a "${mood}" listening session.

CRITICAL RULES — FOLLOW EXACTLY:
1. Look at each album's genre and tags below. ONLY select albums whose genre or tags genuinely relate to the mood "${mood}".
2. If NONE of the albums match the mood, you MUST return an empty items array [] and set playlistName to "No Matches Found". Do NOT force unrelated albums into the playlist just to return something.
3. You MUST ONLY use albums from the list below. Do NOT invent albums, artists, or songs.
4. Each albumId MUST exactly match an "id" value from the collection.
5. playlistName: short creative name, 2-5 words max. No explanations.
6. Selection type: ${type}. ${typeInstructions[type]}
7. Select up to ${maxItems} items.

Example: If the user asks for "jazz" but the collection only has Country and Pop albums, return {"playlistName": "No Matches Found", "items": []}.

Collection:
${JSON.stringify(simplifiedCollection)}`;
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              playlistName: { type: Type.STRING },
              items: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    albumId: { type: Type.STRING },
                    artist: { type: Type.STRING },
                    albumTitle: { type: Type.STRING },
                    itemTitle: { type: Type.STRING }
                  },
                  required: ['albumId', 'artist', 'albumTitle', 'itemTitle']
                }
              }
            }
          }
        }
      });

      const result = JSON.parse(response.text || '{}');
      let name = typeof result.playlistName === 'string' ? result.playlistName.trim() : 'Crate Mix';
      if (name.length > 60) name = name.slice(0, 57) + '...';
      const rawItems = Array.isArray(result.items) ? result.items : [];
      const verifiedItems = rawItems.filter((item: RawPlaylistItem) => item && validIds.has(item.albumId));
      res.status(200).json({
        playlistName: name || 'Crate Mix',
        items: verifiedItems
      });
    } catch (error) {
      console.error('Gemini Playlist Error:', error);
      res.status(500).json({ error: 'Failed to generate playlist' });
    }
  }
);

export default router;
