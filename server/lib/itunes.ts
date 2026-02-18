export interface ITunesCoverResult {
  url: string;
  source: string;
  label?: string;
}

interface ITunesResult {
  artworkUrl100?: string;
  collectionName?: string;
  artistName?: string;
}

export async function searchItunes(artist: string, title: string, limit = 5): Promise<ITunesCoverResult[]> {
  try {
    const query = encodeURIComponent(`${artist} ${title}`);
    const resp = await fetch(`https://itunes.apple.com/search?term=${query}&entity=album&limit=${limit}`);
    if (!resp.ok) return [];
    const json = await resp.json();
    const results = json.results || [];
    return results
      .filter((r: ITunesResult) => r.artworkUrl100)
      .map((r: ITunesResult) => ({
        url: r.artworkUrl100!.replace('100x100bb', '600x600bb'),
        source: 'iTunes',
        label: r.collectionName || undefined,
      }));
  } catch {
    return [];
  }
}
