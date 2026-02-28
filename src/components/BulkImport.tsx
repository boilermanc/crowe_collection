import React, { useState, useCallback, useMemo, useRef } from 'react';
import { parseCSVFile, autoDetectMapping } from '../helpers/csvImportHelpers';
import { REKKRD_FIELDS } from '../types/import';
import type { CSVParseResult, RekkrdField, ColumnMapping } from '../types/import';

interface BulkImportProps {
  onUpgradeRequired: (feature: string) => void;
}

const ACCEPTED_EXTENSIONS = '.csv,.tsv,.txt';

const BulkImport: React.FC<BulkImportProps> = ({ onUpgradeRequired }) => {
  const [parseResult, setParseResult] = useState<CSVParseResult | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping>(new Map());
  const [defaultMapping, setDefaultMapping] = useState<ColumnMapping>(new Map());
  const [parsing, setParsing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Which RekkrdFields are currently assigned
  const assignedFields = useMemo(() => {
    const set = new Set<RekkrdField>();
    for (const val of mapping.values()) {
      if (val) set.add(val);
    }
    return set;
  }, [mapping]);

  const artistMapped = assignedFields.has('artist');
  const titleMapped = assignedFields.has('title');
  const canProceed = artistMapped && titleMapped;

  const handleFile = useCallback(async (file: File) => {
    setParsing(true);
    setParseResult(null);
    setFileName(file.name);

    const result = await parseCSVFile(file);
    const detected = autoDetectMapping(result.headers);

    setParseResult(result);
    setMapping(new Map(detected));
    setDefaultMapping(new Map(detected));
    setParsing(false);
  }, []);

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const onDragLeave = useCallback(() => setDragOver(false), []);

  const updateMapping = useCallback((header: string, value: RekkrdField | null) => {
    setMapping(prev => {
      const next = new Map(prev);
      next.set(header, value);
      return next;
    });
  }, []);

  const resetMappings = useCallback(() => {
    setMapping(new Map(defaultMapping));
  }, [defaultMapping]);

  // Preview data: first 5 rows with current mapping applied
  const previewData = useMemo(() => {
    if (!parseResult) return { headers: [] as { csvHeader: string; rekkrdField: RekkrdField | null }[], rows: [] as Record<string, string>[] };

    const activeHeaders = parseResult.headers
      .map(h => ({ csvHeader: h, rekkrdField: mapping.get(h) ?? null }))
      .filter(h => h.rekkrdField !== null);

    const rows = parseResult.rows.slice(0, 5).map(row => {
      const mapped: Record<string, string> = {};
      for (const { csvHeader, rekkrdField } of activeHeaders) {
        if (rekkrdField) mapped[rekkrdField] = row[csvHeader] ?? '';
      }
      return mapped;
    });

    return { headers: activeHeaders, rows };
  }, [parseResult, mapping]);

  return (
    <div className="min-h-screen pb-24 md:pb-8">
      <div className="max-w-5xl mx-auto px-4 md:px-6 pt-6 space-y-6">
        {/* Page header */}
        <div>
          <h1 className="font-label text-lg md:text-xl tracking-widest uppercase font-bold text-th-text">
            Bulk Import
          </h1>
          <p className="text-th-text3/60 text-sm mt-1">
            Import your collection from a CSV, TSV, or text file
          </p>
        </div>

        {/* Step 1 — File Upload */}
        {!parseResult && !parsing && (
          <section className="glass-morphism rounded-2xl border border-th-surface/[0.10] p-6 md:p-8">
            <div
              role="button"
              tabIndex={0}
              aria-label="Drop a CSV file here or click to browse"
              className={`relative flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-10 md:p-14 transition-all cursor-pointer ${
                dragOver
                  ? 'border-[#dd6e42] bg-[#dd6e42]/[0.06]'
                  : 'border-th-surface/[0.15] hover:border-th-surface/[0.30]'
              }`}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInputRef.current?.click(); } }}
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
            >
              <svg className="w-12 h-12 text-th-text3/40" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <div className="text-center">
                <p className="text-th-text font-medium">
                  Drop your file here, or <span className="text-[#dd6e42] underline underline-offset-2">browse</span>
                </p>
                <p className="text-th-text3/50 text-xs mt-1">CSV, TSV, or TXT — up to 5,000 records</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_EXTENSIONS}
                onChange={onFileChange}
                className="hidden"
                aria-label="Select CSV file"
              />
            </div>
          </section>
        )}

        {/* Loading spinner */}
        {parsing && (
          <section className="glass-morphism rounded-2xl border border-th-surface/[0.10] p-10 flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-3 border-th-surface/[0.15] border-t-[#dd6e42] rounded-full animate-spin" />
            <p className="text-th-text2 text-sm">Parsing {fileName}...</p>
          </section>
        )}

        {/* Parse result — errors, badges, stats */}
        {parseResult && !parsing && (
          <>
            {/* Error banner */}
            {parseResult.errors.length > 0 && (
              <div className="rounded-xl bg-red-500/[0.12] border border-red-400/30 px-5 py-4" role="alert">
                <p className="text-red-300 font-medium text-sm mb-1">Heads up</p>
                <ul className="text-red-300/80 text-xs space-y-0.5 list-disc list-inside">
                  {parseResult.errors.slice(0, 5).map((err, i) => <li key={i}>{err}</li>)}
                  {parseResult.errors.length > 5 && (
                    <li>...and {parseResult.errors.length - 5} more</li>
                  )}
                </ul>
              </div>
            )}

            {/* Stats bar */}
            <div className="flex flex-wrap items-center gap-3">
              {parseResult.isDiscogs && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-500/[0.15] border border-teal-400/30 px-3 py-1 text-xs font-medium text-teal-300">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Discogs export detected — columns auto-mapped
                </span>
              )}
              <span className="text-th-text2 text-sm">
                Found <strong className="text-th-text">{parseResult.totalRows.toLocaleString()}</strong> records
                with <strong className="text-th-text">{parseResult.headers.length}</strong> columns
              </span>
              <button
                onClick={() => { setParseResult(null); setMapping(new Map()); setFileName(''); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                className="ml-auto text-xs text-th-text3/60 hover:text-th-text transition-colors underline underline-offset-2"
                aria-label="Choose a different file"
              >
                Choose different file
              </button>
            </div>

            {/* Step 2 — Column Mapping */}
            <section className="glass-morphism rounded-2xl border border-th-surface/[0.10] p-5 md:p-7">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-label text-base tracking-widest uppercase font-bold text-th-text">
                  Map Columns
                </h2>
                <button
                  onClick={resetMappings}
                  className="text-xs text-th-text3/60 hover:text-th-text transition-colors underline underline-offset-2"
                  aria-label="Reset column mappings to auto-detected defaults"
                >
                  Reset Mappings
                </button>
              </div>

              {/* Required fields warning */}
              {(!artistMapped || !titleMapped) && (
                <div className="flex items-center gap-2 rounded-lg bg-orange-500/[0.10] border border-orange-400/25 px-4 py-2.5 mb-5" role="alert">
                  <svg className="w-4 h-4 text-orange-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
                  </svg>
                  <p className="text-orange-300/90 text-xs">
                    {!artistMapped && !titleMapped
                      ? 'Artist and Album Title must be mapped to continue.'
                      : !artistMapped
                        ? 'Artist must be mapped to continue.'
                        : 'Album Title must be mapped to continue.'}
                  </p>
                </div>
              )}

              {/* Mapping rows */}
              <div className="space-y-2">
                {/* Header labels (desktop) */}
                <div className="hidden md:grid grid-cols-[1fr_auto_1fr] gap-3 px-1 pb-1 text-[10px] uppercase tracking-widest text-th-text3/50 font-label">
                  <span>Your CSV Columns</span>
                  <span className="w-6" />
                  <span>Rekkrd Fields</span>
                </div>

                {parseResult.headers.map(header => {
                  const value = mapping.get(header) ?? null;
                  const isMapped = value !== null;

                  return (
                    <div
                      key={header}
                      className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-2 md:gap-3 items-center rounded-lg px-3 py-2.5 bg-th-surface/[0.03] border border-th-surface/[0.06]"
                    >
                      {/* CSV column name */}
                      <div className="flex items-center gap-2 min-w-0">
                        {isMapped ? (
                          <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <span className="w-4 h-4 flex items-center justify-center text-th-text3/30 flex-shrink-0">—</span>
                        )}
                        <span className="text-sm text-th-text truncate" title={header}>{header}</span>
                      </div>

                      {/* Arrow (desktop only) */}
                      <svg className="hidden md:block w-4 h-4 text-th-text3/30" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>

                      {/* Dropdown */}
                      <select
                        value={value ?? ''}
                        onChange={(e) => updateMapping(header, (e.target.value || null) as RekkrdField | null)}
                        aria-label={`Map "${header}" to a Rekkrd field`}
                        className="w-full rounded-lg bg-th-surface/[0.06] border border-th-surface/[0.10] text-sm text-th-text px-3 py-2 appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#dd6e42]/50 transition-colors"
                      >
                        <option value="">Skip this column</option>
                        {REKKRD_FIELDS.map(f => {
                          const disabled = assignedFields.has(f.value) && f.value !== value;
                          return (
                            <option key={f.value} value={f.value} disabled={disabled}>
                              {f.label}{disabled ? ' (already mapped)' : ''}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Data Preview */}
            {previewData.headers.length > 0 && (
              <section className="glass-morphism rounded-2xl border border-th-surface/[0.10] p-5 md:p-7">
                <h2 className="font-label text-base tracking-widest uppercase font-bold text-th-text mb-4">
                  Preview
                </h2>
                <div className="overflow-x-auto -mx-2">
                  <table className="w-full text-sm" role="table" aria-label="CSV data preview">
                    <thead>
                      <tr className="border-b border-th-surface/[0.10]">
                        {previewData.headers.map(({ rekkrdField }) => {
                          const label = REKKRD_FIELDS.find(f => f.value === rekkrdField)?.label ?? 'Skipped';
                          return (
                            <th
                              key={rekkrdField}
                              className="text-left text-[10px] uppercase tracking-widest text-th-text3/50 font-label px-3 py-2 whitespace-nowrap"
                              role="columnheader"
                            >
                              {label}
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.rows.map((row, i) => (
                        <tr key={i} className="border-b border-th-surface/[0.05] last:border-0">
                          {previewData.headers.map(({ rekkrdField }) => (
                            <td
                              key={rekkrdField}
                              className="px-3 py-2 text-th-text2 truncate max-w-[200px]"
                              title={rekkrdField ? row[rekkrdField] : ''}
                            >
                              {rekkrdField ? row[rekkrdField] || '—' : ''}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {parseResult.rows.length > 5 && (
                  <p className="text-th-text3/40 text-xs mt-3 px-3">
                    Showing 5 of {parseResult.totalRows.toLocaleString()} records
                  </p>
                )}
              </section>
            )}

            {/* Navigation */}
            <div className="flex justify-end">
              <button
                disabled={!canProceed}
                aria-label="Proceed to review import"
                className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all ${
                  canProceed
                    ? 'bg-[#dd6e42] text-white hover:brightness-110 active:scale-[0.98] shadow-lg'
                    : 'bg-th-surface/[0.08] text-th-text3/30 cursor-not-allowed'
                }`}
              >
                Next: Review
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BulkImport;
