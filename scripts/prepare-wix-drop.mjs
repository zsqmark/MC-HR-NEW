/**
 * Packages `dist/` into `wix-drop/` for a Wix Headless Drop upload.
 *
 * Why this exists:
 *  - Wix's static upload serves files verbatim and only accepts a fixed set of
 *    file types. `pdf` is NOT on that list, and the "Food handler skills and
 *    knowledge checklist" PDF is load-bearing (onboarding gate, both onboarding
 *    flows, document library, checklist preview modal).
 *  - So the PDF is published once as a base64 `data:` URI on a global
 *    (`window.__CHECKLIST_PDF_URL__`), and every reference to the PDF path is
 *    rewired to read that global. All 13 references in the built bundle are
 *    double-quoted string literals in value positions, so replacing the quoted
 *    literal with a bare identifier keeps them valid expressions. Each PDF link
 *    carries a `download` attribute, so a `data:` URI downloads rather than
 *    navigating (which Chrome would block).
 *  - Node server artifacts (`dist/server.cjs`, `dist/server.cjs.map`) are
 *    deliberately excluded: they cannot run on a static host and they embed
 *    server-side source.
 *
 * Usage:  npm run build && node scripts/prepare-wix-drop.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const projectRoot = process.cwd();
const distDir = path.join(projectRoot, 'dist');
const outDir = path.join(projectRoot, 'wix-drop');

/* ------------------------------------------------------------------ env load */

/**
 * Vite inlines `VITE_*` variables at build time from `.env`, so read the same
 * file here to learn which client ID this build should contain.
 */
function loadEnvFile() {
  const p = path.join(projectRoot, '.env');
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (!m) continue;
    const value = m[2].replace(/^["']|["']$/g, '');
    if (!process.env[m[1]] && value) process.env[m[1]] = value;
  }
}
loadEnvFile();

/**
 * Packaging a demo-mode build for a Wix deploy would ship an app that ignores
 * Wix entirely - mock data, a `1234` PIN, no CMS - which is a silent and very
 * confusing failure. It must therefore be impossible to do by accident.
 * `--demo` exists for deliberately packaging the offline demo.
 */
const DEMO_MODE = process.argv.includes('--demo');
const CLIENT_ID = (process.env.VITE_WIX_CLIENT_ID || '').trim();

// Exactly the extensions Wix accepts for a static upload.
const ALLOWED_EXT = new Set([
  '.html', '.htm',
  '.css',
  '.js', '.mjs', '.cjs', '.jsx', '.map',
  '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico', '.avif', '.bmp',
  '.woff', '.woff2', '.ttf', '.otf', '.eot',
  '.json', '.xml', '.txt', '.md',
]);

// Files that are technically an allowed extension but must not ship.
const EXCLUDED_FILES = new Set(['server.cjs', 'server.cjs.map']);

const MAX_FILE_BYTES = 3 * 1024 * 1024;   // 3MB per file
const MAX_TOTAL_BYTES = 20 * 1024 * 1024; // 20MB total

const PDF_REL = 'public/Food handler skills and knowledge checklist.pdf';
const PDF_LITERAL = '/Food handler skills and knowledge checklist.pdf';
const PDF_QUOTED = `"${PDF_LITERAL}"`;
const PDF_GLOBAL = 'window.__CHECKLIST_PDF_URL__';
const PDF_SIDECAR = 'assets/checklist-pdf.js';
const TEXT_EXT = new Set(['.html', '.htm', '.css', '.js', '.mjs', '.jsx', '.map', '.json', '.xml', '.svg', '.txt', '.md']);

function fail(msg) {
  console.error(`\n  ERROR: ${msg}\n`);
  process.exit(1);
}

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.isFile()) out.push(full);
  }
  return out;
}

function relTo(dir) {
  return (p) => path.relative(dir, p).split(path.sep).join('/');
}

// ---------------------------------------------------------------- preflight
if (!fs.existsSync(distDir)) fail('dist/ not found. Run `npm run build` first.');

const pdfPath = path.join(projectRoot, PDF_REL);
if (!fs.existsSync(pdfPath)) fail(`Source PDF not found at ${PDF_REL}`);

const pdfBytes = fs.readFileSync(pdfPath);
const pdfSha = crypto.createHash('sha256').update(pdfBytes).digest('hex');
const dataUri = `data:application/pdf;base64,${pdfBytes.toString('base64')}`;

// Round-trip check: prove the data URI decodes back to the exact PDF bytes.
const decoded = Buffer.from(dataUri.slice(dataUri.indexOf(',') + 1), 'base64');
if (crypto.createHash('sha256').update(decoded).digest('hex') !== pdfSha) {
  fail('base64 round-trip mismatch; refusing to package.');
}

// ------------------------------------------------------------------- build
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

const skipped = [];
const copied = [];
let rewired = 0;
let htmlPatched = false;

for (const file of walk(distDir)) {
  const name = path.basename(file);
  const ext = path.extname(file).toLowerCase();
  const target = path.join(outDir, path.relative(distDir, file));

  if (EXCLUDED_FILES.has(name)) {
    skipped.push(`${path.relative(distDir, file)} (server artifact)`);
    continue;
  }
  if (!ALLOWED_EXT.has(ext)) {
    skipped.push(`${path.relative(distDir, file)} (unsupported type ${ext || 'none'})`);
    continue;
  }

  fs.mkdirSync(path.dirname(target), { recursive: true });

  if (TEXT_EXT.has(ext)) {
    let text = fs.readFileSync(file, 'utf8');
    const hits = text.split(PDF_QUOTED).length - 1;
    if (hits > 0) {
      text = text.split(PDF_QUOTED).join(PDF_GLOBAL);
      rewired += hits;
    }
    // Load the PDF global before the bundle's module script runs.
    if (ext === '.html' && text.includes('<script') && !htmlPatched) {
      const tag = `<script src="/${PDF_SIDECAR}"></script>`;
      text = text.replace('<script', `${tag}\n    <script`);
      htmlPatched = true;
    }
    fs.writeFileSync(target, text, 'utf8');
  } else {
    fs.copyFileSync(file, target);
  }
  copied.push(path.relative(distDir, file));
}

// Publish the PDF exactly once.
const sidecarPath = path.join(outDir, PDF_SIDECAR);
fs.mkdirSync(path.dirname(sidecarPath), { recursive: true });
fs.writeFileSync(sidecarPath, `${PDF_GLOBAL}="${dataUri}";\n`, 'utf8');

// --------------------------------------------------------------- validation
const problems = [];
if (!fs.existsSync(path.join(outDir, 'index.html'))) {
  problems.push('index.html is not at the top level of the upload.');
}
if (!htmlPatched) problems.push('index.html was not patched to load the PDF sidecar.');
if (rewired === 0) problems.push('no PDF references were rewired; the build may have changed shape.');

let totalBytes = 0;
const outFiles = walk(outDir);
for (const file of outFiles) {
  const { size } = fs.statSync(file);
  totalBytes += size;
  const ext = path.extname(file).toLowerCase();
  if (!ALLOWED_EXT.has(ext)) problems.push(`${relTo(outDir)(file)} has unsupported type ${ext}`);
  if (size > MAX_FILE_BYTES) {
    problems.push(`${relTo(outDir)(file)} is ${(size / 1048576).toFixed(2)}MB, over the 3MB per-file limit`);
  }
}
if (totalBytes > MAX_TOTAL_BYTES) {
  problems.push(`upload is ${(totalBytes / 1048576).toFixed(2)}MB, over the 20MB total limit`);
}
// The raw path must not survive anywhere in the shipped files.
for (const file of outFiles) {
  if (!TEXT_EXT.has(path.extname(file).toLowerCase())) continue;
  if (path.basename(file) === path.basename(PDF_SIDECAR)) continue;
  if (fs.readFileSync(file, 'utf8').includes(PDF_LITERAL)) {
    problems.push(`${relTo(outDir)(file)} still references the raw PDF path`);
  }
}

// ---------------------------------------------------- mode guard (do not skip)
//
// Refuse to package a demo-mode build for a Wix deploy. This is checked against
// the built bundle itself, not just the environment, so a `dist/` left over from
// an earlier client-ID-less build cannot slip through.
const bundleFiles = outFiles.filter(
  (f) => path.extname(f) === '.js' && path.basename(f) !== path.basename(PDF_SIDECAR),
);
if (!DEMO_MODE) {
  if (!CLIENT_ID) {
    problems.push(
      'VITE_WIX_CLIENT_ID is not set, so this would package a DEMO-mode build ' +
        '(mock data + the 1234 PIN, no Wix). Set it in .env, rebuild, and retry. ' +
        'Pass --demo only if you genuinely want the offline demo.',
    );
  } else {
    const baked = bundleFiles.some((f) => fs.readFileSync(f, 'utf8').includes(CLIENT_ID));
    if (!baked) {
      problems.push(
        `dist/ does not contain the Wix client ID (${CLIENT_ID.slice(0, 8)}...), so it ` +
          'was built before the client ID was configured. Re-run `npm run build` first.',
      );
    }
  }
}

// ------------------------------------------------------------------- report tail
const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
console.log('\n  Wix Headless Drop package');
console.log('  ' + '-'.repeat(60));
console.log(`  output            wix-drop/`);
console.log(`  references rewired ${rewired} -> ${PDF_GLOBAL}`);
console.log(`  PDF published     1x in ${PDF_SIDECAR} (${kb(fs.statSync(sidecarPath).size)})`);
console.log(`  PDF sha256        ${pdfSha.slice(0, 16)}... (round-trip verified)`);
console.log(`  total size        ${kb(totalBytes)} / 20 MB`);
console.log('');
for (const f of outFiles.sort()) {
  console.log(`    ${kb(fs.statSync(f).size).padStart(10)}  ${relTo(outDir)(f)}`);
}
if (skipped.length) {
  console.log(`\n  excluded (${skipped.length}):`);
  for (const s of skipped) console.log(`    - ${s}`);
}

if (problems.length) {
  console.error('\n  Validation failed:');
  for (const p of problems) console.error(`    - ${p}`);
  console.error('');
  process.exit(1);
}
console.log('\n  OK: all files are Wix-uploadable types and within limits.');
console.log('  Drag wix-drop/ (or a zip of it) onto https://www.wix.com/headless/drop\n');
