'use client';

import Link from 'next/link';
import { ClipboardList, Archive, CalendarDays, FileText, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const QUICK_LINKS = [
  {
    label: 'Create Exam',
    href: '/teacher/exams',
    icon: ClipboardList,
    color: 'bg-indigo-100 text-indigo-600',
    desc: 'Build and schedule a new exam',
  },
  {
    label: 'Question Bank',
    href: '/teacher/bank',
    icon: Archive,
    color: 'bg-violet-100 text-violet-600',
    desc: 'Manage stored question papers',
  },
  {
    label: 'Upcoming Exams',
    href: '/teacher/upcoming',
    icon: CalendarDays,
    color: 'bg-blue-100 text-blue-600',
    desc: 'View scheduled exams',
  },
  {
    label: 'Results',
    href: '/teacher/results',
    icon: FileText,
    color: 'bg-green-100 text-green-600',
    desc: 'See student performance',
  },
  {
    label: 'My Profile',
    href: '/teacher/profile',
    icon: User,
    color: 'bg-gray-100 text-gray-600',
    desc: 'Manage account details',
  },
];

export default function TeacherHomePage() {
  const { profile } = useAuth();
  const firstName = profile?.full_name?.split(' ')[0] ?? 'Teacher';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">
          Welcome back, {firstName} 👋
        </h2>
        <p className="text-gray-500 text-sm mt-1">What would you like to do today?</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {QUICK_LINKS.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.label}
              href={link.href}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow group"
            >
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${link.color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                {link.label}
              </h3>
              <p className="text-sm text-gray-500 mt-1">{link.desc}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
