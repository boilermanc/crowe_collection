/** iTunes Search API result shape */
export interface ITunesResult {
  artworkUrl100?: string;
  collectionName?: string;
  artistName?: string;
}

/** MusicBrainz release from /ws/2/release search */
export interface MusicBrainzRelease {
  id?: string;
  title?: string;
}

/** Album data sent to the playlist endpoint */
export interface PlaylistAlbumInput {
  id: string;
  artist: string;
  title: string;
  genre?: string;
  tags?: string[];
  tracklist?: string[];
}
