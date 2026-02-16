
/** Shape of an album before it has been persisted (no DB-generated fields). */
export interface NewAlbum {
  artist: string;
  title: string;
  year?: string;
  genre?: string;
  cover_url: string;
  original_photo_url?: string;
  description?: string;
  tracklist?: string[];
  tags?: string[];
  isFavorite?: boolean;
  discogs_url?: string;
  musicbrainz_url?: string;
  sample_url?: string;
  // Collector fields
  condition?: string;
  personal_notes?: string;
  price_low?: number;
  price_median?: number;
  price_high?: number;
  play_count?: number;
}

/** A saved album — always has an id and created_at from the database. */
export interface Album extends NewAlbum {
  id: string;
  created_at: string;
}

/** Unvalidated playlist item from Gemini / API response (before enrichment) */
export interface RawPlaylistItem {
  albumId?: string;
  artist?: string;
  albumTitle?: string;
  itemTitle?: string;
}

export interface PlaylistItem {
  albumId: string;
  artist: string;
  albumTitle: string;
  itemTitle: string;
  cover_url: string;
  type: 'album' | 'side' | 'song';
}

export interface Playlist {
  id: string;
  name: string;
  items: PlaylistItem[];
  mood: string;
}
