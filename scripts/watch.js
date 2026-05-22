'use strict';

const chokidar = require('chokidar');
const { spawn } = require('child_process');
const path      = require('path');

const ROOT     = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'Data');

let running = false;

function generate() {
  if (running) return;
  running = true;
  console.log(`\n[watch] Change detected — ${new Date().toLocaleTimeString()}`);
  const proc = spawn(
    'node',
    [path.join(__dirname, 'generate-pdf.js')],
    { cwd: ROOT, stdio: 'inherit' }
  );
  proc.on('close', code => {
    running = false;
    if (code !== 0) console.error('[watch] PDF generation failed (see above)');
  });
}

console.log('[watch] Watching Data/ for changes. Press Ctrl+C to stop.\n');
console.log('[watch] Generating initial PDF...');

chokidar
  .watch(DATA_DIR, { ignoreInitial: false, persistent: true })
  .on('add',    generate)
  .on('change', generate)
  .on('unlink', generate);
