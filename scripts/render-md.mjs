// Convertit une page du CV (index.html, fde.html) en Markdown.
//
// On lit le DOM rendu par Chromium plutôt que le HTML brut : le Markdown reste
// ainsi aligné sur ce que voit le lecteur, sans second source de vérité.
//
// Usage : node scripts/render-md.mjs <page.html> <sortie.md>
//   node scripts/render-md.mjs index.html medhi-famibelle-cv.md
//   node scripts/render-md.mjs fde.html   medhi-famibelle-fde.md

import { chromium } from 'playwright';
import { writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const PAGE = process.argv[2] ?? 'index.html';
const OUT = process.argv[3] ?? 'medhi-famibelle-cv.md';
const SITE = 'https://famibelle.github.io/';

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.goto(pathToFileURL(resolve(PAGE)).href);

  const md = await page.evaluate((site) => {
    const norm = (s) => s.replace(/\s+/g, ' ').trim();

    // Contenu en ligne : texte, liens, emphase. Les séparateurs décoratifs
    // (.sep) sont conservés tels quels, ils portent déjà " · ".
    function inline(node) {
      let out = '';
      for (const n of node.childNodes) {
        if (n.nodeType === 3) { out += n.textContent; continue; }
        if (n.nodeType !== 1) continue;
        const inner = inline(n);
        switch (n.tagName) {
          case 'A': {
            const href = new URL(n.getAttribute('href'), site).href;
            out += `[${norm(inner)}](${href})`;
            break;
          }
          case 'EM': out += `*${norm(inner)}*`; break;
          case 'STRONG': out += `**${norm(inner)}**`; break;
          default: out += inner;
        }
      }
      return out;
    }
    const text = (el) => norm(inline(el));

    const lines = [];
    const push = (s = '') => lines.push(s);

    function entry(el, level) {
      const head = el.querySelector(':scope > .entry-head');
      const role = text(head.querySelector('.entry-role'));
      const org = text(head.querySelector('.entry-org'));
      const dates = text(head.querySelector('.entry-dates'));
      push(`${'#'.repeat(level)} ${role}`);
      push();
      push(`**${org}** — ${dates}`);
      push();
      for (const child of el.children) {
        if (child === head) continue;
        if (child.matches('ul.bullets')) {
          for (const li of child.children) push(`- ${text(li)}`);
          push();
        } else if (child.matches('p.note')) {
          push(`> ${text(child)}`);
          push();
        } else if (child.matches('p.stack')) {
          push(`*Stack: ${text(child)}*`);
          push();
        } else if (child.matches('.missions')) {
          push(`${'#'.repeat(level + 1)} ${text(child.querySelector('.missions-label'))}`);
          push();
          for (const sub of child.querySelectorAll(':scope > article.entry')) {
            entry(sub, level + 2);
          }
        }
      }
    }

    // En-tête
    const id = document.querySelector('.identity');
    push(`# ${text(id.querySelector('h1'))}`);
    push();
    push(`**${text(id.querySelector('.headline'))}**`);
    push();
    for (const li of id.querySelectorAll('.contact li:not(.contact-pdf)')) {
      push(`- ${text(li)}`);
    }
    push();

    for (const section of document.querySelectorAll('main > section')) {
      push(`## ${text(section.querySelector('h2'))}`);
      push();
      for (const el of section.children) {
        if (el.tagName === 'H2') continue;
        if (el.matches('article.entry')) entry(el, 3);
        else if (el.matches('p')) { push(el.classList.contains('note') ? `> ${text(el)}` : text(el)); push(); }
        else if (el.matches('h3')) { push(`### ${text(el)}`); push(); }
        else if (el.matches('ul.projects')) {
          for (const p of el.querySelectorAll(':scope > li.project')) {
            push(`### ${text(p.querySelector('.project-name'))}`);
            push();
            push(`*${text(p.querySelector('.project-tag'))}*`);
            push();
            push(text(p.querySelector('.project-desc')));
            push();
            const links = p.querySelector('.project-links');
            if (links) { push(text(links)); push(); }
          }
        } else if (el.matches('ul')) {
          for (const li of el.children) push(`- ${text(li)}`);
          push();
        } else if (el.matches('dl.skills')) {
          for (const dt of el.querySelectorAll('dt')) {
            push(`- **${text(dt)}**: ${text(dt.nextElementSibling)}`);
          }
          push();
        }
      }
    }
    return lines.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
  }, SITE);

  await writeFile(OUT, md);
  console.log(`Markdown écrit : ${PAGE} -> ${OUT}`);
} finally {
  await browser.close();
}
