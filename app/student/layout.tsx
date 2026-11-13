'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { ClipboardCheck, FileText, LogOut, Menu, BookOpen, X, FolderOpen } from 'lucide-react';
import { useStudent } from '@/contexts/StudentContext';
import { ThemeToggle } from '@/shared/components/ui/ThemeToggle';
import { Spinner } from '@/shared/components/ui/Spinner';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard',       icon: BookOpen,      href: '/student'          },
  { id: 'exams',     label: 'Exams',           icon: ClipboardCheck, href: '/student/exams'   },
  { id: 'results',   label: 'Results',         icon: FileText,       href: '/student/results'  },
  { id: 'materials', label: 'Study Materials', icon: FolderOpen,     href: '/student/materials' },
];

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const { student, loading, signOut } = useStudent();
  const router   = useRouter();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!student && pathname !== '/student/join') {
      router.replace('/student/join');
    }
  }, [student, loading, pathname, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spinner size="lg" />
      </div>
    );
  }

  // Let the join page render without the sidebar shell
  if (!student && pathname === '/student/join') {
    return <>{children}</>;
  }

  if (!student) return null;

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  const activeItem = NAV_ITEMS.find(
    (t) => pathname === t.href || (t.href !== '/student' && pathname.startsWith(t.href)),
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200
          transform transition-transform duration-300 flex flex-col
          ${drawerOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand */}
        <div className="p-4 border-b border-gray-200 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-gray-900 font-semibold text-sm">X-Pert</h2>
            <p className="text-gray-500 text-xs">Student Portal</p>
          </div>
          <button
            type="button"
            className="ml-auto lg:hidden"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close menu"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon     = item.icon;
            const isActive = pathname === item.href || (item.href !== '/student' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => setDrawerOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm
                  ${isActive
                    ? 'bg-indigo-50 text-indigo-600 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                  }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <p className="text-sm text-gray-900 font-medium px-2">{student.full_name}</p>
          <p className="text-xs text-gray-500 px-2 mb-3 truncate">{student.email}</p>
          <ThemeToggle />
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="mt-1 w-full flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white shadow-sm border-b border-gray-200 lg:hidden sticky top-0 z-30">
          <div className="px-4 py-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="p-2 hover:bg-gray-100 rounded-lg"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-gray-900 font-semibold text-sm">
              {activeItem?.label ?? 'Dashboard'}
            </h1>
            <div className="w-10" />
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
