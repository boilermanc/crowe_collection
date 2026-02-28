import Papa from 'papaparse';
import type { CSVParseResult, RekkrdField, ColumnMapping } from '../types/import';

const MAX_ROWS = 5000;

const DISCOGS_HEADERS = ['release_id', 'catalog#'];

const FIELD_PATTERNS: Record<RekkrdField, string[]> = {
  artist: ['artist', 'artist name', 'band', 'performer', 'artist(s)'],
  title: ['title', 'album', 'album title', 'release title', 'release_title'],
  year: ['year', 'released', 'release year', 'release_year', 'original year'],
  genre: ['genre', 'genres', 'style', 'styles'],
  format: ['format', 'media', 'media type', 'vinyl format'],
  condition: ['condition', 'media condition', 'sleeve condition', 'grade'],
  notes: ['notes', 'comments', 'description', 'private notes'],
  label: ['label', 'record label', 'publisher'],
  catalog_number: ['catalog', 'catalog#', 'catalog number', 'cat#', 'cat no'],
};

function parseWithEncoding(
  file: File,
  encoding: string
): Promise<Papa.ParseResult<Record<string, string>>> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      encoding,
      complete: (results) => resolve(results),
      error: (err: Error) => reject(err),
    });
  });
}

export async function parseCSVFile(file: File): Promise<CSVParseResult> {
  const errors: string[] = [];

  let result: Papa.ParseResult<Record<string, string>>;
  try {
    result = await parseWithEncoding(file, 'UTF-8');

    // If we got garbled data (mojibake indicator), retry with Latin-1
    const sample = JSON.stringify(result.data.slice(0, 3));
    if (sample.includes('�') || sample.includes('Ã')) {
      result = await parseWithEncoding(file, 'ISO-8859-1');
    }
  } catch {
    try {
      result = await parseWithEncoding(file, 'ISO-8859-1');
    } catch (fallbackErr) {
      return {
        headers: [],
        rows: [],
        totalRows: 0,
        errors: [`Failed to parse CSV: ${fallbackErr instanceof Error ? fallbackErr.message : 'Unknown error'}`],
        isDiscogs: false,
      };
    }
  }

  // Collect PapaParse errors
  for (const err of result.errors) {
    errors.push(`Row ${err.row ?? '?'}: ${err.message}`);
  }

  const headers = result.meta.fields ?? [];
  const allRows = result.data;
  const totalRows = allRows.length;

  let rows = allRows;
  if (totalRows > MAX_ROWS) {
    rows = allRows.slice(0, MAX_ROWS);
    errors.push(`File contains ${totalRows} rows. Only the first ${MAX_ROWS} will be imported.`);
  }

  const isDiscogs = headers.some(
    (h) => DISCOGS_HEADERS.includes(h.toLowerCase())
  );

  return { headers, rows, totalRows, errors, isDiscogs };
}

export function autoDetectMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = new Map();

  // Track which fields have already been assigned to avoid duplicates
  const assignedFields = new Set<RekkrdField>();

  for (const header of headers) {
    const normalized = header.toLowerCase().trim();
    let matched: RekkrdField | null = null;

    for (const [field, patterns] of Object.entries(FIELD_PATTERNS) as [RekkrdField, string[]][]) {
      if (assignedFields.has(field)) continue;

      // Exact match first, then partial (header contains pattern or pattern contains header)
      if (
        patterns.includes(normalized) ||
        patterns.some((p) => normalized.includes(p) || p.includes(normalized))
      ) {
        matched = field;
        break;
      }
    }

    if (matched) {
      assignedFields.add(matched);
    }
    mapping.set(header, matched);
  }

  return mapping;
}
