'use client';

import React from 'react';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  id?: string;
}

/**
 * Toggle
 *
 * Accessible toggle switch. Replaces all inline button-toggle patterns.
 */
export function Toggle({ checked, onChange, label, description, disabled = false, id }: ToggleProps) {
  const switchId = id ?? `toggle-${label?.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div className="flex items-start gap-3">
      <button
        type="button"
        role="switch"
        id={switchId}
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
          checked ? 'bg-indigo-600' : 'bg-gray-200'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
      {(label || description) && (
        <div className="flex flex-col">
          {label && (
            <label htmlFor={switchId} className="text-sm font-medium text-gray-900 cursor-pointer">
              {label}
            </label>
          )}
          {description && <p className="text-xs text-gray-500">{description}</p>}
        </div>
      )}
    </div>
  );
}
