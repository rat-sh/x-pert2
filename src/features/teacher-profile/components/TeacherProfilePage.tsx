'use client';
import { useAuth } from '@/contexts/AuthContext';
import { User, Mail, Phone, GraduationCap, Calendar } from 'lucide-react';

export function TeacherProfilePage() {
  const { profile } = useAuth();

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-gray-900 text-xl font-semibold">My Profile</h2>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        {/* Avatar */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
            {profile?.full_name?.charAt(0).toUpperCase() ?? 'T'}
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">{profile?.full_name}</h3>
            <span className="inline-flex items-center gap-1 mt-1 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
              <GraduationCap className="w-4 h-4" /> Teacher
            </span>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-4 border-t border-gray-100 pt-6">
          {[
            { icon: User, label: 'Full Name', val: profile?.full_name },
            { icon: Mail, label: 'Email', val: profile?.email },
            { icon: Phone, label: 'Phone', val: profile?.phone ?? 'Not set' },
            { icon: Calendar, label: 'Member Since', val: profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—' },
          ].map(({ icon: Icon, label, val }) => (
            <div key={label} className="flex items-start gap-4">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                <Icon className="w-4 h-4 text-gray-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
                <p className="text-sm font-medium text-gray-900 mt-0.5">{val}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
