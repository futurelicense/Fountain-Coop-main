import type { Metadata } from 'next';
import './globals.css';
import { AuthSessionSync } from '@/components/auth/AuthSessionSync';

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
      <body>
        <AuthSessionSync />
        {children}
      </body>
    </html>
  );
}
