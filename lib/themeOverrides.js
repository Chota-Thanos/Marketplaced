/**
 * Runtime theme overrides, fetched server-side and emitted as a <style> block.
 *
 * The generated tokens in packages/tokens are the defaults. This re-points the
 * same CSS custom properties, so an admin changing `accent` in the panel moves
 * every `bg-accent`, `text-accent` and `ring-accent` in the app at once —
 * exactly as if the token itself had changed. No component knows this exists.
 *
 * Only tokens an admin has deliberately overridden are stored, so a future
 * change to the shipped defaults still reaches everything else.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';

/** Hex only. Anything else never reaches the stylesheet. */
const HEX = /^#[0-9a-fA-F]{6}$/;

export async function fetchThemeOverrides() {
  try {
    const res = await fetch(`${API_BASE}/theme`, {
      headers: { Accept: 'application/json' },
      // Short revalidate rather than no-store: this is on every page, and an
      // admin changing a colour can wait a minute to see it site-wide.
      next: { revalidate: 60 },
    });

    if (!res.ok) return null;

    const body = await res.json();
    return body?.data ?? null;
  } catch {
    // The storefront must render with its shipped tokens if the API is down.
    // A theme fetch failing is not a reason to show nothing.
    return null;
  }
}

/**
 * Builds the CSS. Returns '' when there is nothing to override, so the common
 * case adds no bytes to the page.
 */
export function buildThemeCss(overrides) {
  if (!overrides) return '';

  const { colors = {}, colors_dark: colorsDark = {}, geometry = {} } = overrides;

  const decls = (entries, transform) =>
    Object.entries(entries || {})
      .map(transform)
      .filter(Boolean)
      .join('');

  const colorDecls = (entries) =>
    decls(entries, ([token, value]) =>
      HEX.test(String(value)) ? `--ds-${token}:${value};` : '',
    );

  const geometryDecls = decls(geometry, ([key, value]) => {
    const px = Number(value);
    if (!Number.isFinite(px) || px < 0 || px > 48) return '';
    // `radius-card` -> `--ds-radius-card`
    return `--ds-${key}:${px}px;`;
  });

  const light = colorDecls(colors) + geometryDecls;
  const dark = colorDecls(colorsDark);

  if (!light && !dark) return '';

  // Emitted after the token stylesheet, so these win on equal specificity.
  return [
    light ? `:root{${light}}` : '',
    dark ? `.dark{${dark}}` : '',
  ].join('');
}
