import React from 'react';

// Assuming logo.png is in public/assets/ or a top-level assets/ folder
// The path /assets/logo.png assumes it's served from the root.
const logoUrl = '/assets/logo.png'; 

export const Header: React.FC = () => {
  return (
    <header className="mb-8 text-center w-full max-w-3xl mx-auto flex flex-col items-center">
      <img 
        src={logoUrl} 
        alt="Observer App Logo" 
        className="h-20 sm:h-24 mb-4" // Adjusted height and added bottom margin
        aria-label="Observer App Logo" 
      />
      <p className="text-lg text-gray-400"> {/* Removed mt-3 as image now has mb-4 */}
        Capture images with your webcam and get AI-powered descriptions.
      </p>
    </header>
  );
};