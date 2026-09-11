import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Macbeth Sales — Prototype',
  description: 'Retail sales monitoring prototype. Phase 1: deployed skeleton.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
