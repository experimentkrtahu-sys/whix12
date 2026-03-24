import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: { default: 'StreamCatalog', template: '%s | StreamCatalog' },
  description: 'Legal streaming-style catalog for authorized third-party video sources.',
  openGraph: {
    title: 'StreamCatalog',
    description: 'Discover and watch from authorized external sources.',
    type: 'website'
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        <Navbar />
        <main className="min-h-[calc(100vh-128px)]">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
