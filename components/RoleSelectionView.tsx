import React from 'react';
import { UserRole } from '../types';
import { VideoCameraIcon, EyeIcon } from '@heroicons/react/24/outline';

// Assuming logo.png is in public/assets/ or a top-level assets/ folder
const logoUrl = '/assets/logo.png';

interface RoleSelectionViewProps {
  onSelectRole: (role: UserRole) => void;
}

export const RoleSelectionView: React.FC<RoleSelectionViewProps> = ({ onSelectRole }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[calc(100vh-200px)] py-8">
      <div className="bg-gray-800 p-8 sm:p-12 rounded-xl shadow-2xl text-center w-full max-w-2xl">
        <img 
          src={logoUrl} 
          alt="Observer App Logo" 
          className="h-28 sm:h-32 mx-auto mb-6" // Added logo with appropriate sizing and margin
          aria-label="Observer App Logo"
        />
        <h2 className="text-3xl font-bold text-sky-400 mb-8">Choose Your Role</h2>
        <p className="text-gray-400 mb-10 max-w-md mx-auto">
          Select whether you want to share your camera feed or view someone else's feed.
          This is a simulation of P2P video streaming.
        </p>
        <div className="flex flex-col sm:flex-row space-y-6 sm:space-y-0 sm:space-x-6">
          <button
            onClick={() => onSelectRole(UserRole.CAMERA)}
            className="w-full sm:w-64 flex flex-col items-center justify-center px-6 py-8 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg shadow-lg transition-all duration-150 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-opacity-75"
            aria-label="Become Camera Operator"
          >
            <VideoCameraIcon className="h-12 w-12 mb-3" aria-hidden="true" />
            <span className="text-xl">Be the Camera</span>
            <span className="text-xs mt-1 text-teal-200">(Share Your Feed)</span>
          </button>
          <button
            onClick={() => onSelectRole(UserRole.VIEWER)}
            className="w-full sm:w-64 flex flex-col items-center justify-center px-6 py-8 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-lg transition-all duration-150 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-opacity-75"
            aria-label="Become Remote Viewer"
          >
            <EyeIcon className="h-12 w-12 mb-3" aria-hidden="true" />
            <span className="text-xl">Be the Viewer</span>
            <span className="text-xs mt-1 text-indigo-200">(View a Shared Feed)</span>
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-12">
          <strong>Note:</strong> True peer-to-peer streaming requires a backend signaling server.
          This feature simulates the pairing and viewing experience locally.
        </p>
      </div>
    </div>
  );
};