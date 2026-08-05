/**
 * One-shot codemod: rewrite raw Tailwind palette utilities to design-system
 * tokens across app/ and components/.
 *
 * Run: node packages/tokens/codemod-utilities.mjs [--dry]
 *
 * Two things it does that matter beyond find-and-replace:
 *
 *  1. It DELETES `dark:` colour variants rather than translating them. The
 *     tokens already carry a dark value, so `bg-surface` is correct in both
 *     themes; a surviving `dark:bg-gray-800` would fight it and win.
 *
 *  2. It collapses the six-way rounded-md/lg/xl/2xl/3xl/full spread onto the
 *     five role-named radii, so "which rounding does a card get" has one answer.
 *
 * This is deliberately a script and not a manual pass: 2,469 replacements done
 * by hand is 2,469 chances to introduce a one-character difference.
 */

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const DRY = process.argv.includes('--dry');

// ─── Colour mappings ─────────────────────────────────────────────────────────
// Ramp position carries meaning: 50/100 are tinted fills, 400-700 are the
// saturated colour, 800+ on neutrals are inverted surfaces.
const NEUTRALS = ['gray', 'slate', 'zinc', 'neutral', 'stone'];
const ACCENTS = ['blue', 'indigo', 'violet', 'purple', 'sky', 'cyan'];
const SUCCESS = ['green', 'emerald', 'teal'];
const DANGER = ['red', 'rose', 'pink', 'fuchsia'];
const WARNING = ['amber', 'yellow', 'orange'];

const map = new Map();
const add = (from, to) => map.set(from, to);

for (const n of NEUTRALS) {
  add(`bg-${n}-50`, 'bg-surface-muted');
  add(`bg-${n}-100`, 'bg-surface-sunken');
  add(`bg-${n}-200`, 'bg-surface-sunken');
  add(`bg-${n}-300`, 'bg-surface-sunken');
  for (const s of [700, 800, 900, 950]) add(`bg-${n}-${s}`, 'bg-inverse');

  add(`text-${n}-950`, 'text-ink');
  add(`text-${n}-900`, 'text-ink');
  add(`text-${n}-800`, 'text-ink');
  add(`text-${n}-700`, 'text-ink-muted');
  add(`text-${n}-600`, 'text-ink-muted');
  add(`text-${n}-500`, 'text-ink-subtle');
  add(`text-${n}-400`, 'text-ink-subtle');
  add(`text-${n}-300`, 'text-ink-subtle');

  for (const s of [50, 100, 200, 300]) add(`border-${n}-${s}`, 'border-line');
  for (const s of [400, 500, 600, 700, 800, 900]) add(`border-${n}-${s}`, 'border-line-strong');

  // 100/200 as a *text* colour only makes sense over a dark surface, so it maps
  // to the inverse ink rather than to the subtle grey the same step means as a
  // background.
  for (const s of [50, 100, 200]) add(`text-${n}-${s}`, 'text-ink-inverse');

  for (const s of [100, 200, 300]) add(`divide-${n}-${s}`, 'divide-line');
  for (const s of [500, 600, 700, 800, 900, 950]) add(`ring-${n}-${s}`, 'ring-line-strong');
  for (const s of [200, 300]) add(`to-${n}-${s}`, 'to-surface-sunken');
  for (const s of [200, 300]) add(`from-${n}-${s}`, 'from-surface-sunken');
  for (const s of [50, 100]) add(`via-${n}-${s}`, 'via-surface-muted');
  for (const s of [200, 300]) add(`via-${n}-${s}`, 'via-surface-sunken');
  for (const s of [700, 800, 900, 950]) add(`via-${n}-${s}`, 'via-inverse');
  for (const s of [300, 400, 500]) add(`placeholder-${n}-${s}`, 'placeholder-ink-subtle');
  for (const s of [200, 300, 400]) add(`ring-${n}-${s}`, 'ring-line');
  for (const s of [50, 100]) add(`from-${n}-${s}`, 'from-surface-muted');
  for (const s of [800, 900, 950]) add(`from-${n}-${s}`, 'from-inverse');
  for (const s of [800, 900, 950]) add(`to-${n}-${s}`, 'to-inverse');
  for (const s of [50, 100]) add(`to-${n}-${s}`, 'to-surface-muted');
}

const semantic = [
  [ACCENTS, 'accent'],
  [SUCCESS, 'success'],
  [DANGER, 'danger'],
  [WARNING, 'warning'],
  // Lime is the brand's highlight colour, not a status — it has no soft tint.
  [['lime'], 'highlight'],
];

for (const [families, token] of semantic) {
  for (const f of families) {
    for (const s of [50, 100]) {
      add(`bg-${f}-${s}`, `bg-${token}-soft`);
      add(`from-${f}-${s}`, `from-${token}-soft`);
      add(`to-${f}-${s}`, `to-${token}-soft`);
    }
    add(`via-${f}-50`, `via-${token}-soft`);
    add(`via-${f}-100`, `via-${token}-soft`);
    for (const s of [200, 300, 400, 500, 600, 700, 800, 900, 950]) {
      add(`bg-${f}-${s}`, `bg-${token}`);
      add(`from-${f}-${s}`, `from-${token}`);
      add(`to-${f}-${s}`, `to-${token}`);
      add(`via-${f}-${s}`, `via-${token}`);
      add(`ring-${f}-${s}`, `ring-${token}`);
    }
    for (const s of [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]) {
      add(`text-${f}-${s}`, `text-${token}`);
      add(`border-${f}-${s}`, `border-${token}`);
    }
  }
}

// Absolutes
add('bg-white', 'bg-surface');
add('bg-black', 'bg-inverse');
add('text-white', 'text-ink-inverse');
add('text-black', 'text-ink');
add('border-white', 'border-surface');
add('border-black', 'border-line-strong');
add('from-white', 'from-surface');
add('to-white', 'to-surface');
add('from-black', 'from-inverse');
add('to-black', 'to-inverse');
add('divide-gray-100', 'divide-line');

// The previous half-adopted brand layer, folded into the new names.
const brandAliases = {
  'brand-primary-hover': 'primary-hover',
  'brand-primary': 'primary',
  'brand-accent-hover': 'accent-hover',
  'brand-accent': 'accent',
  'brand-highlight-hover': 'highlight-hover',
  'brand-highlight': 'highlight',
  'brand-danger-light': 'danger-soft',
  'brand-danger': 'danger',
  'brand-success': 'success',
  'brand-sale': 'sale',
  'brand-new-tag': 'new',
  'brand-surface': 'surface',
  'brand-offwhite': 'canvas',
  'brand-page-text': 'ink',
  'brand-page': 'canvas',
  'brand-ink': 'ink',
  'brand-text-dark': 'ink',
  'brand-text-muted': 'ink-muted',
  'brand-text-dim': 'ink-subtle',
  'brand-border-subtle': 'line',
  'brand-border-hover': 'line-strong',
  'brand-pastel-green': 'pastel-green',
  'brand-pastel-tan': 'pastel-tan',
  'brand-pastel-blue': 'pastel-blue',
};

for (const [from, to] of Object.entries(brandAliases)) {
  for (const prop of ['bg', 'text', 'border', 'ring', 'from', 'to', 'via', 'divide']) {
    add(`${prop}-${from}`, `${prop}-${to}`);
  }
}

add('ring-white', 'ring-surface');
add('via-white', 'via-surface');
add('via-black', 'via-inverse');

// Shadow: Tailwind's size scale onto the four elevation roles.
add('shadow-xs', 'shadow-subtle');
add('shadow-sm', 'shadow-subtle');
add('shadow-md', 'shadow-card');
add('shadow-lg', 'shadow-card');
add('shadow-xl', 'shadow-hover');
add('shadow-2xl', 'shadow-panel');

// Radius: role names replace the size-name spread.
add('rounded-xs', 'rounded-chip');
add('rounded-sm', 'rounded-chip');
add('rounded-md', 'rounded-chip');
add('rounded-lg', 'rounded-control');
add('rounded-xl', 'rounded-control');
add('rounded-2xl', 'rounded-card');
add('rounded-3xl', 'rounded-panel');
add('rounded-full', 'rounded-pill');
for (const side of ['t', 'b', 'l', 'r', 'tl', 'tr', 'bl', 'br']) {
  add(`rounded-${side}-lg`, `rounded-${side}-control`);
  add(`rounded-${side}-xl`, `rounded-${side}-control`);
  add(`rounded-${side}-2xl`, `rounded-${side}-card`);
  add(`rounded-${side}-3xl`, `rounded-${side}-panel`);
  add(`rounded-${side}-full`, `rounded-${side}-pill`);
}

// Longest-first, so `bg-brand-primary-hover` is not eaten by `bg-brand-primary`.
const ordered = [...map.entries()].sort((a, b) => b[0].length - a[0].length);

// ─── Rewrite ─────────────────────────────────────────────────────────────────
function walk(dir, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path, acc);
    else if (/\.(js|jsx)$/.test(entry.name)) acc.push(path);
  }
  return acc;
}

const files = [...walk('app'), ...walk('components')];

let filesChanged = 0;
let replacements = 0;
let darkStripped = 0;

for (const file of files) {
  const before = readFileSync(file, 'utf8');
  let out = before;

  // 1. Drop `dark:` colour variants — the tokens handle both themes now, and a
  //    leftover dark: override has higher specificity than the variable it is
  //    trying to help. Matches variant prefixes on either side of `dark:`
  //    (md:dark:bg-…, dark:hover:text-…) and takes the leading space with it.
  out = out.replace(
    /\s*(?:[a-z0-9-]+:)*dark:(?:[a-z0-9-]+:)*(?:bg|text|border|ring|divide|placeholder|from|via|to|shadow)-[\w/.[\]()%-]+/g,
    () => {
      darkStripped += 1;
      return '';
    },
  );

  // 2. Palette utilities -> tokens, preserving any variant prefix and any
  //    /opacity suffix by only matching the utility core.
  for (const [from, to] of ordered) {
    const re = new RegExp(`(?<![\\w-])${from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\w-])`, 'g');
    out = out.replace(re, () => {
      replacements += 1;
      return to;
    });
  }

  if (out !== before) {
    filesChanged += 1;
    if (!DRY) writeFileSync(file, out);
  }
}

console.log(
  `${DRY ? '[dry run] ' : ''}${replacements} utilities rewritten, ` +
    `${darkStripped} dark: colour variants removed, across ${filesChanged} files`,
);
