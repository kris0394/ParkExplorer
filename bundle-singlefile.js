import fs from 'fs';
import path from 'path';

const distDir = path.resolve('dist');
const htmlFile = path.join(distDir, 'index.html');

if (!fs.existsSync(htmlFile)) {
  console.error('dist/index.html not found. Run npm run build first.');
  process.exit(1);
}

let html = fs.readFileSync(htmlFile, 'utf8');

// Inline CSS
html = html.replace(/<link[^>]+rel="stylesheet"[^>]+href="(\.?\/)?assets\/([^">]+)"[^>]*>/gi, (match, prefix, cssName) => {
  const cssPath = path.join(distDir, 'assets', cssName);
  if (fs.existsSync(cssPath)) {
    const cssContent = fs.readFileSync(cssPath, 'utf8');
    return `<style>\n${cssContent}\n</style>`;
  }
  return match;
});

// Inline JS module
html = html.replace(/<script[^>]+type="module"[^>]+src="(\.?\/)?assets\/([^">]+)"[^>]*><\/script>/gi, (match, prefix, jsName) => {
  const jsPath = path.join(distDir, 'assets', jsName);
  if (fs.existsSync(jsPath)) {
    const jsContent = fs.readFileSync(jsPath, 'utf8');
    return `<script type="module">\n${jsContent}\n</script>`;
  }
  return match;
});

// Task 12: copy any downloaded NPS data into the standalone file (no key is involved, it is plain public data)
const npsDir = path.join(distDir, 'nps');
if (fs.existsSync(npsDir)) {
  const all = {};
  for (const f of fs.readdirSync(npsDir)) {
    if (!f.endsWith('.json')) continue;
    try {
      all[f.replace(/\.json$/, '')] = JSON.parse(fs.readFileSync(path.join(npsDir, f), 'utf8'));
    } catch {
      /* skip unreadable file */
    }
  }
  if (Object.keys(all).length > 0) {
    // '<' is escaped so the data can never close the script tag early
    const safe = JSON.stringify(all).replace(/</g, '\\u003c');
    const tag = '<script>window.__NPS_DATA__ = ' + safe + ';</script>\n<script type="module">';
    html = html.replace('<script type="module">', () => tag);
  }
}

const outPath = path.resolve('park-explorer.html');
fs.writeFileSync(outPath, html, 'utf8');
// Also place a copy in dist so the GitHub Pages site can offer it as a download
fs.writeFileSync(path.join(distDir, 'park-explorer.html'), html, 'utf8');

console.log(`Generated standalone ${outPath} (${(html.length / 1024 / 1024).toFixed(2)} MB)`);
