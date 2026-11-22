// The Midnight Gallery — make.fun entry builder (v2)
// Authored for best-heist-game-20261122-0559.
// This entrypoint validates the entry, copies game/ and screenshots/
// deterministically into the output directory, and writes dossier.json
// using the vendored buildDossier helper. Node 24 runs .ts directly.
import { buildDossier } from './vendor/makefun-game.ts';
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------------------
// Constants: the caps mirror the gate values documented in the vendor header.
// ---------------------------------------------------------------------------
const CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
} as const;

const MIN_SCREENSHOTS = 3;
const MAX_SCREENSHOT_BYTES = CAPS.screenshots.max_bytes;
const MAX_GAME_BYTES = CAPS.game_max_bytes;
const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png']);
const REQUIRED_GAME_FILES = ['game/index.html'];

// ---------------------------------------------------------------------------
// Small helpers (deterministic, no timestamps anywhere in the output).
// ---------------------------------------------------------------------------
function fail(message: string): never {
  console.error(`[midnight-gallery] ERROR: ${message}`);
  process.exit(1);
}

function info(message: string): void {
  console.log(`[midnight-gallery] ${message}`);
}

function extensionOf(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot < 0 ? '' : name.slice(dot).toLowerCase();
}

function listFilesRecursive(root: string): string[] {
  const out: string[] = [];
  const walk = (dir: string): void => {
    const entries = readdirSync(dir, { withFileTypes: true })
      .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
    for (const entry of entries) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile()) out.push(full);
      else fail(`unsupported entry in tree: ${full}`);
    }
  };
  walk(root);
  return out.sort();
}

function totalBytes(files: string[]): number {
  let total = 0;
  for (const file of files) total += statSync(file).size;
  return total;
}

function isJpeg(bytes: Uint8Array): boolean {
  return bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
}

function isPng(bytes: Uint8Array): boolean {
  return (
    bytes.length > 8 &&
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  );
}

// ---------------------------------------------------------------------------
// Pre-flight validation.
// ---------------------------------------------------------------------------
function validateGame(rootDir: string): { files: string[]; bytes: number } {
  for (const rel of REQUIRED_GAME_FILES) {
    const full = join(rootDir, rel);
    if (!existsSync(full)) fail(`required file missing: ${rel}`);
    if (!statSync(full).isFile()) fail(`required path is not a file: ${rel}`);
  }
  const gameDir = join(rootDir, 'game');
  const files = listFilesRecursive(gameDir);
  if (files.length === 0) fail('game/ is empty');
  if (files.length > CAPS.game_max_files) {
    fail(`game/ has ${files.length} files, cap is ${CAPS.game_max_files}`);
  }
  const bytes = totalBytes(files);
  if (bytes > MAX_GAME_BYTES) fail(`game/ is ${bytes} bytes, cap is ${MAX_GAME_BYTES}`);
  // Guard against two easy-to-miss submission defects found in testing:
  // an empty source file (a truncated write) and a single file so large
  // it would crowd out the dossier text budget on its own.
  for (const file of files) {
    const size = statSync(file).size;
    if (size === 0) fail(`game file is empty: ${relative(rootDir, file)}`);
    if (size > 1024 * 1024) {
      fail(`game file over 1 MiB: ${relative(rootDir, file)} (${size} bytes)`);
    }
  }
  const html = readFileSync(join(gameDir, 'index.html'), 'utf8');
  if (!html.includes('<canvas')) fail('game/index.html must contain a <canvas> element');
  if (/https?:\/\//.test(html)) fail('game/index.html must not reference external URLs');
  info(`game/: ${files.length} files, ${bytes} bytes`);
  return { files, bytes };
}

function validateScreenshots(rootDir: string): { files: string[]; bytes: number } {
  const dir = join(rootDir, 'screenshots');
  if (!existsSync(dir)) fail('screenshots/ directory missing');
  const names = readdirSync(dir).sort();
  const files = names
    .filter((n) => IMAGE_EXTENSIONS.has(extensionOf(n)))
    .map((n) => join(dir, n));
  if (files.length < MIN_SCREENSHOTS) {
    fail(`screenshots/ needs at least ${MIN_SCREENSHOTS} images, found ${files.length}`);
  }
  if (files.length > CAPS.screenshots.max) {
    fail(`screenshots/ has ${files.length} images, cap is ${CAPS.screenshots.max}`);
  }
  for (const file of files) {
    const size = statSync(file).size;
    if (size > MAX_SCREENSHOT_BYTES) {
      fail(`screenshot ${relative(rootDir, file)} is ${size} bytes, cap is ${MAX_SCREENSHOT_BYTES}`);
    }
    const head = readFileSync(file);
    if (!isJpeg(head) && !isPng(head)) {
      fail(`screenshot ${relative(rootDir, file)} is neither JPEG nor PNG`);
    }
  }
  const bytes = totalBytes(files);
  info(`screenshots/: ${files.length} files, ${bytes} bytes`);
  return { files, bytes };
}

// ---------------------------------------------------------------------------
// Deterministic copy: sorted order, no timestamps written into any file.
// ---------------------------------------------------------------------------
function copyTreeSorted(srcDir: string, dstDir: string): void {
  mkdirSync(dstDir, { recursive: true });
  const entries = readdirSync(srcDir, { withFileTypes: true })
    .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  for (const entry of entries) {
    const src = join(srcDir, entry.name);
    const dst = join(dstDir, entry.name);
    if (entry.isDirectory()) copyTreeSorted(src, dst);
    else if (entry.isFile()) cpSync(src, dst);
    else fail(`unsupported entry while copying: ${src}`);
  }
}

function prepareOutput(outputDir: string): void {
  // The grader pre-creates the output directory (owned by root) and runs
  // this program as an unprivileged user, so removing the directory itself
  // fails with EPERM. Keep the directory in place and clear only its
  // contents, entry by entry, so a second run starts from the same empty
  // state as a fresh one.
  mkdirSync(outputDir, { recursive: true });
  for (const entry of readdirSync(outputDir)) {
    rmSync(join(outputDir, entry), { recursive: true, force: true });
  }
}

// ---------------------------------------------------------------------------
// Main flow.
// ---------------------------------------------------------------------------
function main(): void {
  const rootDir = resolve(dirname(fileURLToPath(import.meta.url)));
  const outputDir = resolve(process.env.MAKEFUN_OUTPUT_DIR ?? '/output');
  info(`root: ${rootDir}`);
  info(`output: ${outputDir}`);
  if (outputDir === rootDir) fail('output directory must differ from the repo root');

  const game = validateGame(rootDir);
  const shots = validateScreenshots(rootDir);

  prepareOutput(outputDir);
  copyTreeSorted(join(rootDir, 'game'), join(outputDir, 'game'));
  copyTreeSorted(join(rootDir, 'screenshots'), join(outputDir, 'screenshots'));

  const dossier = buildDossier(outputDir, CAPS);
  writeFileSync(join(outputDir, 'dossier.json'), dossier);

  const dossierBytes = statSync(join(outputDir, 'dossier.json')).size;
  info(`dossier.json: ${dossierBytes} bytes`);
  info(`summary: game ${game.files.length} files/${game.bytes}B, ` +
    `screenshots ${shots.files.length} files/${shots.bytes}B`);
  info('done: The Midnight Gallery entry is ready');
}

main();
