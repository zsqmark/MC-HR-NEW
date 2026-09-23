/**
 * Tests for base64 data-URL parsing and sizing.
 *
 * These helpers decide what gets uploaded and what gets rejected, and both
 * mistakes are silent: an over-counted size rejects valid photos, while an
 * under-counted one lets a multi-megabyte base64 blob reach a CMS item field,
 * which is exactly the failure this module exists to prevent.
 *
 * Run:  npx tsx scripts/test-dataUrl.ts
 */
import {
  isDataUrl,
  parseDataUrl,
  dataUrlByteLength,
  isTooLarge,
  safeFileName,
  MAX_UPLOAD_BYTES,
} from '../src/lib/wix/dataUrl';

let passed = 0;
const failures: string[] = [];

function check(label: string, condition: boolean, detail = '') {
  if (condition) passed++;
  else failures.push(`${label}${detail ? ` -> ${detail}` : ''}`);
}

/* ------------------------------------------------------------------- isDataUrl */

check('accepts a png data URL', isDataUrl('data:image/png;base64,iVBORw0KGgo='));
check('accepts a pdf data URL', isDataUrl('data:application/pdf;base64,JVBERi0='));
check('rejects a plain path', !isDataUrl('/logo.svg'));
check('rejects an http URL', !isDataUrl('https://example.com/a.png'));
check('rejects a non-base64 data URL', !isDataUrl('data:text/plain,hello'));
check('rejects undefined', !isDataUrl(undefined));
check('rejects null', !isDataUrl(null));
check('rejects a number', !isDataUrl(42));

/* ----------------------------------------------------------------- parseDataUrl */

{
  const p = parseDataUrl('data:image/jpeg;base64,AAAA');
  check('parses mime type', p?.mimeType === 'image/jpeg', String(p?.mimeType));
  check('parses payload', p?.base64 === 'AAAA', String(p?.base64));
}

{
  // A charset parameter must not be mistaken for the MIME type.
  const p = parseDataUrl('data:image/png;charset=utf-8;base64,ZZZ');
  check('handles extra parameters', p?.mimeType === 'image/png' && p?.base64 === 'ZZZ', JSON.stringify(p));
}

{
  // The comma may appear inside the payload; only the first one separates.
  const p = parseDataUrl('data:image/png;base64,AA,BB');
  check('splits on the first comma only', p?.base64 === 'AA,BB', String(p?.base64));
}

{
  const p = parseDataUrl('data:;base64,AAAA');
  check('empty mime falls back to octet-stream', p?.mimeType === 'application/octet-stream', String(p?.mimeType));
}

check('malformed without comma is null', parseDataUrl('data:image/png;base64') === null);
check('non-base64 marker is null', parseDataUrl('data:image/png,AAAA') === null);
check('plain string is null', parseDataUrl('hello') === null);

/* ----------------------------------------------------------- dataUrlByteLength */

{
  // Known-answer checks. 4 base64 chars encode 3 bytes.
  check('4 chars -> 3 bytes', dataUrlByteLength('data:image/png;base64,AAAA') === 3,
    String(dataUrlByteLength('data:image/png;base64,AAAA')));
  // "AAA=" -> 2 bytes (one padding char).
  check('padding = removes 1', dataUrlByteLength('data:image/png;base64,AAA=') === 2,
    String(dataUrlByteLength('data:image/png;base64,AAA=')));
  // "AA==" -> 1 byte (two padding chars).
  check('padding == removes 2', dataUrlByteLength('data:image/png;base64,AA==') === 1,
    String(dataUrlByteLength('data:image/png;base64,AA==')));
}

{
  // Verify against the real decoded length for a range of payload sizes, which
  // is the property that actually matters.
  let mismatches = 0;
  for (const size of [1, 2, 3, 4, 5, 17, 255, 1000, 4096]) {
    const raw = Buffer.alloc(size, 7);
    const url = `data:application/octet-stream;base64,${raw.toString('base64')}`;
    if (dataUrlByteLength(url) !== size) {
      mismatches++;
      failures.push(`decoded length for ${size} bytes -> got ${dataUrlByteLength(url)}`);
    }
  }
  check('byte length matches decoded length for all sizes', mismatches === 0, String(mismatches));
}

check('empty payload is 0', dataUrlByteLength('data:image/png;base64,') === 0);
check('malformed is 0', dataUrlByteLength('nonsense') === 0);
check('whitespace in payload is ignored', dataUrlByteLength('data:image/png;base64,AA\nAA') === 3);

/* ------------------------------------------------------------------ isTooLarge */

{
  const small = 'data:image/png;base64,AAAA';
  check('small file is not too large', !isTooLarge(small));

  // Build a payload just over a tiny limit to test the boundary precisely.
  const raw = Buffer.alloc(100, 1);
  const url = `data:application/octet-stream;base64,${raw.toString('base64')}`;
  check('exactly at the limit is allowed', !isTooLarge(url, 100), String(dataUrlByteLength(url)));
  check('one byte over the limit is rejected', isTooLarge(url, 99));
  check('default ceiling is 25MB', MAX_UPLOAD_BYTES === 25 * 1024 * 1024, String(MAX_UPLOAD_BYTES));
}

/* ----------------------------------------------------------------- safeFileName */

check('keeps a simple name', safeFileName('photo.png') === 'photo.png', safeFileName('photo.png'));
check('spaces become dashes', safeFileName('my photo.png') === 'my-photo.png', safeFileName('my photo.png'));
check('strips path traversal', safeFileName('../../etc/passwd') === 'etc-passwd', safeFileName('../../etc/passwd'));
check('strips backslash paths', safeFileName('a\\b\\c.png') === 'a-b-c.png', safeFileName('a\\b\\c.png'));
check('appends extension from mime when missing',
  safeFileName('scan', 'image/jpeg') === 'scan.jpeg', safeFileName('scan', 'image/jpeg'));
check('replaces unsafe characters', safeFileName('a<b>c?.png') === 'a_b_c_.png', safeFileName('a<b>c?.png'));
check('empty name falls back with no mime', safeFileName('') === 'upload', safeFileName(''));
check('empty name falls back with mime', safeFileName('', 'image/png') === 'upload.png', safeFileName('', 'image/png'));
check('long names are truncated', safeFileName('x'.repeat(300) + '.png').length <= 100,
  String(safeFileName('x'.repeat(300) + '.png').length));
check('dotfile keeps its extension', safeFileName('.gitignore') === 'gitignore', safeFileName('.gitignore'));

/* ---------------------------------------------------------------------- report */

console.log('\n  Base64 data-URL helper test');
console.log('  ' + '-'.repeat(58));
console.log(`  assertions passed : ${passed}`);
console.log(`  assertions failed : ${failures.length}`);

if (failures.length) {
  console.error('\n  FAILURES:');
  for (const f of failures) console.error(`    - ${f}`);
  process.exit(1);
}
console.log('\n  OK: parsing, sizing and name sanitising are correct.\n');
