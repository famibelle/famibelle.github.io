// Rend index.html en PDF A4 via Chromium headless.
//
// La mise en page imprimée appartient entièrement à assets/print.css, qui porte
// déjà `@page { size: A4; margin: 14mm 15mm }`. On passe donc `preferCSSPageSize`
// pour que Chromium s'efface derrière la feuille de style : sans ça, il imposerait
// son propre format (Letter) et ses propres marges, et le rendu CI différerait de
// celui obtenu par Ctrl+P dans le navigateur.
//
// Usage : node scripts/render-pdf.mjs [chemin-de-sortie.pdf]

import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';

const ROOT = resolve(process.cwd());
const OUT = process.argv[2] ?? 'medhi-famibelle-cv.pdf';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2',
};

// On sert la page en HTTP plutôt que de l'ouvrir en file:// : c'est ce que fait
// GitHub Pages, et le script de thème inline lit localStorage, inaccessible sur
// file:// dans certains navigateurs.
const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const rel = normalize(decodeURIComponent(url.pathname));
  const file = join(ROOT, rel === '/' ? 'index.html' : rel);

  // Garde-fou contre la traversée de répertoire (../).
  if (!file.startsWith(ROOT)) {
    res.writeHead(403).end('forbidden');
    return;
  }
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404).end('not found');
  }
});

await new Promise((r) => server.listen(0, '127.0.0.1', r));
const { port } = server.address();

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'networkidle' });

  // print.css neutralise déjà le thème sombre, mais on force le schéma clair :
  // le PDF doit être noir sur blanc quel que soit l'environnement d'exécution.
  await page.emulateMedia({ media: 'print', colorScheme: 'light' });

  await page.pdf({ path: OUT, printBackground: true, preferCSSPageSize: true });
  console.log(`PDF écrit : ${OUT}`);
} finally {
  await browser.close();
  server.close();
}
