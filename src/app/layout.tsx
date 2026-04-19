import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Fountain Coop Unified Financial System',
  description: 'Cooperative savings, loans, and member operations',
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
