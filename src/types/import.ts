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

export interface ImportCandidate {
  artist: string;
  title: string;
  year?: string;
  genre?: string;
  format?: string;
  condition?: string;
  notes?: string;
  label?: string;
  catalog_number?: string;
  csvRowNumber: number;
  duplicateStatus?: 'new' | 'likely_duplicate' | 'exact_duplicate';
  matchedAlbum?: { artist: string; title: string };
}

export interface SkippedRow {
  rowNumber: number;
  reason: string;
  rawData: Record<string, string>;
}

export interface ValidationResult {
  valid: ImportCandidate[];
  skipped: SkippedRow[];
  warnings: string[];
}

export interface ImportError {
  rowNumber: number;
  error: string;
}

export interface ImportResult {
  totalAttempted: number;
  totalInserted: number;
  totalFailed: number;
  errors: ImportError[];
  durationMs: number;
}
