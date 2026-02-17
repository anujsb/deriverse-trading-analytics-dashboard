const DEFAULT_PROGRAM_IDS = [
  'CDESjex4EDBKLwx9ZPzVbjiHEHatasb5fhSJZMzNfvw2',
  'Drvrseg8AQLP8B96DBGmHRjFGviFNYTkHueY9g3k27Gu',
] as const;

function parseProgramIds(raw?: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export const DERIVERSE_PROGRAM_IDS = Array.from(
  new Set([
    ...parseProgramIds(process.env.PROGRAM_IDS),
    ...(process.env.PROGRAM_ID ? [process.env.PROGRAM_ID] : []),
    ...(process.env.NEXT_PUBLIC_DERIVERSE_PROGRAM_ID
      ? [process.env.NEXT_PUBLIC_DERIVERSE_PROGRAM_ID]
      : []),
    ...DEFAULT_PROGRAM_IDS,
  ])
);


export const DERIVERSE_PROGRAM_ID = DERIVERSE_PROGRAM_IDS[0];


export const DERIVERSE_VERSION = parseInt(process.env.VERSION ?? '6', 10);

export const deriverseConfig = {
  programIds: DERIVERSE_PROGRAM_IDS,
  programId: DERIVERSE_PROGRAM_ID,
  version: DERIVERSE_VERSION,
} as const;
