import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, id, className = '', ...props }: TextareaProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
          {label}
          {props.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <textarea
        id={inputId}
        {...props}
        className={`w-full px-3 py-2.5 border rounded-lg text-sm text-gray-900 bg-white
          placeholder:text-gray-400 focus:outline-none focus:ring-2 resize-none transition-colors
          ${error ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 focus:ring-indigo-500'}
          ${className}`}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
