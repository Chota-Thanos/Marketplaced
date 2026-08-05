import './globals.css';
import React from 'react';
import { seo, brand } from '@ds/brand';
import { tokens, fontsHref } from '@ds/tokens';

import ClientLayout from '../components/providers/ClientLayout';
import { ThemeProvider } from '../components/providers/ThemeProvider';
import ServiceWorkerRegistrar from '../components/providers/ServiceWorkerRegistrar';
import { fetchThemeOverrides, buildThemeCss } from '../lib/themeOverrides';

export const metadata = {
  title: seo.title,
  description: seo.description,
  keywords: seo.keywords,
  openGraph: {
    title: seo.og.title,
    description: seo.og.description,
    url: seo.og.url,
    siteName: seo.og.siteName,
    locale: 'en_IN',
    type: 'website',
  },
};

// Matches the token that paints the page, so the browser chrome doesn't flash a
// different colour than the app behind it.
export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: tokens.color.canvas },
    { media: '(prefers-color-scheme: dark)', color: tokens.colorDark.canvas },
  ],
};

export default async function RootLayout({ children }) {
  // Admin-set token overrides. Emitted after the generated tokens so they win,
  // and rendered server-side so there is no flash of the default palette.
  const themeCss = buildThemeCss(await fetchThemeOverrides());

  return (
    <html lang={brand.locale} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Href is generated from packages/tokens, so the families fetched here
            are exactly the ones the font tokens name — they cannot drift. */}
        <link rel="stylesheet" href={fontsHref} />
        <link rel="manifest" href="/manifest.json" />
        {themeCss && (
          // Values are allow-listed by token name and matched against a hex
          // pattern server-side before they are stored, and buildThemeCss
          // re-checks them here — this string can only ever be custom-property
          // declarations.
          <style id="ds-theme-overrides" dangerouslySetInnerHTML={{ __html: themeCss }} />
        )}
      </head>
      {/* No `dark:` variants: bg-canvas and text-ink resolve through CSS custom
          properties that the .dark block in the generated tokens re-points. */}
      <body className="bg-canvas text-ink min-h-screen flex flex-col font-sans">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <ServiceWorkerRegistrar />
          <ClientLayout>{children}</ClientLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}
