import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50">
        <Icon className="h-8 w-8 text-indigo-400" />
      </div>
      <h3 className="mb-1 text-base font-semibold text-gray-900">{title}</h3>
      {description && (
        <p className="mb-4 max-w-xs text-sm text-gray-500">{description}</p>
      )}
      {action}
    </div>
  );
}
