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

const outPath = path.resolve('park-explorer.html');
fs.writeFileSync(outPath, html, 'utf8');
// Also place a copy in dist so the GitHub Pages site can offer it as a download
fs.writeFileSync(path.join(distDir, 'park-explorer.html'), html, 'utf8');

console.log(`Generated standalone ${outPath} (${(html.length / 1024 / 1024).toFixed(2)} MB)`);
