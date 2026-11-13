import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { StudentProvider } from '@/contexts/StudentContext';
import { Toaster } from 'sonner';
import { startKeepAlive } from '@/lib/keepAlive';

// Start keep-alive pinger on server boot (prevents Render free-tier sleep)
startKeepAlive();

const geist = Geist({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'X-Pert — Smart Exam Platform',
  description: 'Create, manage, and take exams online. Built for teachers and students.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={geist.className}>
      <body className="min-h-screen bg-gray-50" suppressHydrationWarning>
        <AuthProvider>
          <StudentProvider>
            {children}
            <Toaster position="top-right" richColors />
          </StudentProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
