export const CONDITION_GRADES = [
  { label: 'Mint (M)', value: 'Mint', order: 0 },
  { label: 'Near Mint (NM)', value: 'Near Mint', order: 1 },
  { label: 'Very Good Plus (VG+)', value: 'Very Good Plus', order: 2 },
  { label: 'Very Good (VG)', value: 'Very Good', order: 3 },
  { label: 'Good Plus (G+)', value: 'Good Plus', order: 4 },
  { label: 'Good (G)', value: 'Good', order: 5 },
  { label: 'Fair (F)', value: 'Fair', order: 6 },
  { label: 'Poor (P)', value: 'Poor', order: 7 },
] as const;

export const CONDITION_ORDER: Record<string, number> = Object.fromEntries(
  CONDITION_GRADES.map(({ value, order }) => [value, order])
);
