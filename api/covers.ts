import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = {
  maxDuration: 30,
};

interface CoverResult {
  url: string;
  source: string;
  label?: string;
}

const USER_AGENT = 'TheCroweCollection/1.0 (https://github.com/boilermanc/crowe_collection)';

async function searchiTunes(artist: string, title: string): Promise<CoverResult[]> {
  try {
    const query = encodeURIComponent(`${artist} ${title}`);
    const resp = await fetch(`https://itunes.apple.com/search?term=${query}&entity=album&limit=5`);
    if (!resp.ok) return [];
    const json = await resp.json();
    const results = json.results || [];
    return results
      .filter((r: any) => r.artworkUrl100)
      .map((r: any) => ({
        url: r.artworkUrl100.replace('100x100bb', '600x600bb'),
        source: 'iTunes',
        label: r.collectionName || undefined,
      }));
  } catch {
    return [];
  }
}

async function searchMusicBrainz(artist: string, title: string): Promise<CoverResult[]> {
  try {
    const query = encodeURIComponent(`artist:${artist} release:${title}`);
    const resp = await fetch(
      `https://musicbrainz.org/ws/2/release/?query=${query}&fmt=json&limit=5`,
      { headers: { 'User-Agent': USER_AGENT } }
    );
    if (!resp.ok) return [];
    const json = await resp.json();
    const releases = json.releases || [];
    const candidates = releases
      .filter((r: any) => r.id)
      .map((r: any) => ({
        url: `https://coverartarchive.org/release/${r.id}/front-500`,
        source: 'MusicBrainz' as const,
        label: r.title || undefined,
      }));

    // Validate URLs exist (Cover Art Archive returns 404 for releases without art)
    const checks = await Promise.allSettled(
      candidates.map((c: CoverResult) => fetch(c.url, { method: 'HEAD', redirect: 'follow' }))
    );
    return candidates.filter((_: CoverResult, i: number) => {
      const result = checks[i];
      return result.status === 'fulfilled' && result.value.ok;
    });
  } catch {
    return [];
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { artist, title } = req.body;
    if (!artist || !title || typeof artist !== 'string' || typeof title !== 'string') {
      return res.status(400).json({ error: 'Missing artist or title' });
    }

    const [itunesResults, mbResults] = await Promise.all([
      searchiTunes(artist, title),
      searchMusicBrainz(artist, title),
    ]);

    // Interleave and deduplicate by URL
    const seen = new Set<string>();
    const covers: CoverResult[] = [];
    const all = [...itunesResults, ...mbResults];
    for (const cover of all) {
      if (!seen.has(cover.url)) {
        seen.add(cover.url);
        covers.push(cover);
      }
      if (covers.length >= 10) break;
    }

    return res.status(200).json({ covers });
  } catch (error) {
    console.error('Cover Search Error:', error);
    return res.status(500).json({ error: 'Failed to search covers' });
  }
}
