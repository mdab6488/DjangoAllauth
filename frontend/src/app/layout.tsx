// src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import ClientLayout from './ClientLayout';

export const metadata: Metadata = {
  title: 'My App',
  description: 'Next.js application with MUI',
  icons: { icon: '/favicon.ico' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}