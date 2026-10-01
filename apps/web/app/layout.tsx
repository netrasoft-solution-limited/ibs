import type { Metadata } from 'next';

import './globals.css';
import { getTenant } from '@/lib/api';

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getTenant();
  return {
    title: {
      default: `${tenant.shortName} — Revenue Platform`,
      template: `%s · ${tenant.shortName}`,
    },
    description: `Revenue assessment, billing, collection and compliance for ${tenant.stateName}.`,
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const tenant = await getTenant();

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap"
        />
      </head>
      <body
        style={
          {
            // Tenant identity is applied at request time, never compiled in.
            '--tenant-accent': tenant.theme.accent,
            '--tenant-accent-dark': tenant.theme.accentDark,
          } as React.CSSProperties
        }
      >
        {children}
      </body>
    </html>
  );
}
