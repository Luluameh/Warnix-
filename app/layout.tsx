// app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';
import 'leaflet/dist/leaflet.css';

export const metadata: Metadata = {
  title: 'WARNIX — EOC Multi-Agent Society',
  description: 'AI Emergency Operations Center coordinating disaster response in real-time through parallel multi-agent debate, negotiation, and human loop synthesis.',
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
