export const REKKRD_FIELDS = [
  { value: 'artist', label: 'Artist' },
  { value: 'title', label: 'Album Title' },
  { value: 'year', label: 'Year' },
  { value: 'genre', label: 'Genre' },
  { value: 'format', label: 'Format' },
  { value: 'condition', label: 'Condition' },
  { value: 'notes', label: 'Notes' },
  { value: 'label', label: 'Label' },
  { value: 'catalog_number', label: 'Catalog Number' },
] as const;

export type RekkrdField =
  | 'artist'
  | 'title'
  | 'year'
  | 'genre'
  | 'format'
  | 'condition'
  | 'notes'
  | 'label'
  | 'catalog_number';

export type ColumnMapping = Map<string, RekkrdField | null>;

export interface CSVParseResult {
  headers: string[];
  rows: Record<string, string>[];
  totalRows: number;
  errors: string[];
  isDiscogs: boolean;
}
