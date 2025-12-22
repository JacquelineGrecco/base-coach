import type { Metadata } from 'next';
import { AuthProvider } from '@/features/auth/context/AuthContext';
import './globals.css';

export const metadata: Metadata = {
  title: 'Base Coach - Professional Sports Training Management',
  description: 'Manage your team, track player performance, and improve training sessions with AI-powered insights.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="font-sans antialiased" suppressHydrationWarning>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

