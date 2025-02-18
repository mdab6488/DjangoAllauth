import ClientLayout from './ClientLayout';

export default function ServerLayout({ children }: { children: React.ReactNode }) {
  return <ClientLayout>{children}</ClientLayout>;
}
