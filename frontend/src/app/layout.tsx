import type { Metadata, Viewport } from "next";
import ServerLayout from './ServerLayout';

export const metadata: Metadata = {
  title: 'My Page',
  description: 'Description of my page',
  icons: {
    icon: '/favicon.ico', // Add your favicon
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ServerLayout>
          {children}
        </ServerLayout>
      </body>
    </html>
  );
}