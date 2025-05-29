
import React, { useRef, useEffect } from 'react';
import { ConnectionStatus } from '../types';
import { ArrowPathIcon, SignalSlashIcon, WifiIcon, XCircleIcon, EyeIcon, SignalIcon, ArrowUturnLeftIcon } from '@heroicons/react/24/outline'; 
import { LoadingSpinner } from './LoadingSpinner';

interface ViewerViewProps {
  stream: MediaStream | null; 
  connectionStatus: ConnectionStatus;
  onConnect: () => void;
  inputCode: string;
  setInputCode: (code: string) => void;
  onStopViewing: () => void;
  onBackToRoleSelection: () => void; // New prop
}

export const ViewerView: React.FC<ViewerViewProps> = ({
  stream,
  connectionStatus,
  onConnect,
  inputCode,
  setInputCode,
  onStopViewing,
  onBackToRoleSelection // New prop
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(error => console.error("Error playing remote stream:", error));
    } else if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [stream]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConnect();
  };

  const renderStatusMessage = () => {
    switch (connectionStatus) {
      case ConnectionStatus.ATTEMPTING_CONNECTION:
        return <LoadingSpinner text="Attempting to connect..." />;
      case ConnectionStatus.INVALID_CODE:
        return (
          <div className="text-center text-red-400 p-4 bg-red-900 bg-opacity-50 rounded-lg">
            <XCircleIcon className="h-12 w-12 mx-auto mb-2" />
            <p className="text-xl font-semibold">Connection Failed</p>
            <p>Invalid or expired pairing code. Please check and try again.</p>
          </div>
        );
      case ConnectionStatus.CONNECTED:
        return (
          <div className="text-center text-green-400">
            <WifiIcon className="h-8 w-8 mx-auto mb-2" />
            <p className="text-lg font-semibold">Connected to Camera</p>
            <p className="text-xs text-gray-400">(Simulated P2P Stream)</p>
          </div>
        );
      default: 
        return (
            <div className="text-center text-sky-400">
                <EyeIcon className="h-12 w-12 mx-auto mb-2" />
                <p className="text-xl font-semibold">View Remote Feed</p>
                <p className="text-sm text-gray-400">Enter the pairing code provided by the camera user.</p>
            </div>
        );
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-gray-800 p-6 sm:p-8 rounded-xl shadow-2xl flex flex-col space-y-6">
      <h2 className="text-2xl font-bold text-center text-indigo-400 mb-2">Remote Viewer Mode</h2>
      
      <div className="aspect-video bg-gray-700 rounded-lg overflow-hidden shadow-inner relative">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
          aria-label="Remote camera feed"
        />
        {(!stream || connectionStatus !== ConnectionStatus.CONNECTED) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-700 bg-opacity-80 p-4">
            {renderStatusMessage()}
          </div>
        )}
      </div>
      
      {connectionStatus !== ConnectionStatus.CONNECTED && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="pairingCode" className="block text-sm font-medium text-indigo-300 mb-1">
              Pairing Code:
            </label>
            <input
              type="text"
              id="pairingCode"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition placeholder-gray-500 text-center tracking-widest font-mono text-lg"
              placeholder="ABCXYZ"
              maxLength={6}
              disabled={connectionStatus === ConnectionStatus.ATTEMPTING_CONNECTION}
              aria-label="Pairing Code Input"
            />
          </div>
          <button
            type="submit"
            disabled={!inputCode.trim() || connectionStatus === ConnectionStatus.ATTEMPTING_CONNECTION}
            className="w-full flex items-center justify-center px-6 py-3 rounded-lg font-semibold text-white transition-all duration-150 ease-in-out bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
          >
            {connectionStatus === ConnectionStatus.ATTEMPTING_CONNECTION ? (
              <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
            ) : (
              <SignalIcon className="h-5 w-5 mr-2" />
            )}
            {connectionStatus === ConnectionStatus.ATTEMPTING_CONNECTION ? 'Connecting...' : 'Connect to Feed'}
          </button>
        </form>
      )}

      {connectionStatus === ConnectionStatus.CONNECTED && (
        <button
          onClick={onStopViewing}
          className="w-full flex items-center justify-center px-6 py-3 rounded-lg font-semibold text-white transition-all duration-150 ease-in-out bg-red-600 hover:bg-red-700 shadow-md hover:shadow-lg"
        >
          <SignalSlashIcon className="h-5 w-5 mr-2" />
          Stop Viewing
        </button>
      )}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <button
          onClick={onBackToRoleSelection}
          className="w-full flex items-center justify-center px-6 py-3 rounded-lg font-semibold text-gray-300 bg-gray-700 hover:bg-gray-600 transition-all duration-150 ease-in-out shadow-md hover:shadow-lg"
          aria-label="Change role and go back to role selection"
        >
          <ArrowUturnLeftIcon className="h-5 w-5 mr-2" aria-hidden="true" />
          Change Role
        </button>
      </div>
        <p className="text-xs text-yellow-400 text-center mt-0"> {/* Adjusted margin from mt-4 to mt-0 as button above has mt-4 */}
            (Simulated P2P Connection. The video displayed is from your local camera if it were active as 'Camera', or a placeholder if no camera active.)
        </p>
    </div>
  );
};
