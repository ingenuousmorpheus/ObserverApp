import React from 'react';
import { XCircleIcon } from '@heroicons/react/24/solid';

interface ErrorDisplayProps {
  message: string;
  onClear?: () => void;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message, onClear }) => {
  if (!message) return null;
  return (
    <div className="bg-red-600 border border-red-700 text-white p-4 rounded-lg my-4 shadow-lg w-full max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <XCircleIcon className="h-6 w-6 mr-3 text-red-200"/>
          <p><span className="font-bold">Error:</span> {message}</p>
        </div>
        {onClear && (
          <button
            onClick={onClear}
            className="ml-4 px-3 py-1.5 bg-red-700 hover:bg-red-800 rounded-md text-sm font-medium text-red-100 transition-colors"
            aria-label="Dismiss error"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
};
