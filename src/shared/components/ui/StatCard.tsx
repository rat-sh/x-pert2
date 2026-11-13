import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  iconBg?: string;
  iconColor?: string;
  trend?: string;
  trendUp?: boolean;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  iconBg = 'bg-indigo-50',
  iconColor = 'text-indigo-600',
  trend,
  trendUp,
}: StatCardProps) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
          {trend && (
            <p className={`mt-1 text-xs font-medium ${trendUp ? 'text-green-600' : 'text-red-500'}`}>
              {trend}
            </p>
          )}
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${iconBg}`}>
          <Icon className={`h-6 w-6 ${iconColor}`} />
        </div>
      </div>
    </div>
  );
}
