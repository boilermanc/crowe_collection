export const MEDIA_FORMATS = ['Vinyl', 'Cassette', '8-Track'] as const;
export type MediaFormat = typeof MEDIA_FORMATS[number];

export const FORMAT_COLORS: Record<MediaFormat, string> = {
  'Vinyl': '#dd6e42',
  'Cassette': '#34D399',
  '8-Track': '#A855F7',
};

export const FORMAT_DEFAULT: MediaFormat = 'Vinyl';
