
import React, { useRef, useEffect, useCallback } from 'react';
import { AppStatus, ConnectionStatus, UserRole } from '../types'; 
import { PhotoIcon, VideoCameraIcon, VideoCameraSlashIcon, SparklesIcon, SignalIcon, SignalSlashIcon, ArrowPathIcon, ArrowUturnLeftIcon } from '@heroicons/react/24/outline';

interface CameraViewProps {
  onCapture: (imageDataUrl: string) => void;
  currentStatus: AppStatus;
  setAppStatus: React.Dispatch<React.SetStateAction<AppStatus>>;
  setError: (message: string | null) => void;
  stream: MediaStream | null;
  setStream: React.Dispatch<React.SetStateAction<MediaStream | null>>;
  isCameraEnabled: boolean;
  setIsCameraEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  prompt: string;
  setPrompt: React.Dispatch<React.SetStateAction<string>>;
  
  isFeedShared: boolean;
  onToggleFeedSharing: () => void;
  pairingCode: string | null; 
  connectionStatus: ConnectionStatus;
  userRole: UserRole;
  onBackToRoleSelection: () => void; // New prop
}

export const CameraView: React.FC<CameraViewProps> = ({
  onCapture,
  currentStatus,
  setAppStatus,
  setError,
  stream,
  setStream,
  isCameraEnabled,
  setIsCameraEnabled,
  prompt,
  setPrompt,
  isFeedShared,
  onToggleFeedSharing,
  pairingCode, 
  connectionStatus,
  userRole,
  onBackToRoleSelection // New prop
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startUserMedia = useCallback(async () => {
    setError(null);
    setAppStatus(AppStatus.InitializingCamera);
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: true }); 
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        videoRef.current.muted = true; 
      }
      setAppStatus(AppStatus.CameraReady);
    } catch (err: any) {
      console.error("Error accessing camera/microphone:", err); 
      let detailedMessage = "Could not access camera/microphone. Please check permissions and try again."; 

      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError') {
          detailedMessage = "Camera and/or Microphone access denied. The app requests both. This is often due to browser permissions (check site settings via the lock icon for both Camera and Microphone), OS privacy settings, or the page not being served over HTTPS/localhost. Ensure no other app is using the camera/microphone. Please verify these settings and retry.";
        } else if (err.name === 'NotFoundError') {
          detailedMessage = "No camera or microphone was found. Ensure devices are connected, enabled, and not disabled by your OS. If devices are present, ensure they are selected in browser settings if multiple are available.";
        } else if (err.name === 'NotReadableError') {
          detailedMessage = "Camera or microphone is unreadable. It might be in use by another app, or there's a hardware/driver issue. Try closing other apps using these devices, restarting your browser, or checking device drivers.";
        } else if (err.name === 'AbortError') {
            detailedMessage = "Camera/microphone access aborted. This can happen if the page is closed or navigated away during permission request, or if another operation interrupted it."
        } else if (err.name === 'SecurityError') {
            detailedMessage = "Camera/microphone access denied due to security settings. This page MUST be served over HTTPS or from localhost/file origins. Check the URL in your address bar.";
        } else if (err.name === 'OverconstrainedError') {
            detailedMessage = `Requested camera/microphone settings (e.g., resolution) are not supported by your device. Error: ${err.message}`;
        } else { 
            detailedMessage = `A camera/microphone error occurred (${err.name}): ${err.message}. Ensure the page is served over HTTPS/localhost and check browser/OS permissions for both camera and microphone.`;
        }
      } else if (err && typeof err.message === 'string') {
        const lowerMessage = err.message.toLowerCase();
        if (lowerMessage.includes('permission denied') || lowerMessage.includes('not allowed') || lowerMessage.includes('denied permission')) {
            detailedMessage = "Camera and/or Microphone permission denied. The app requests both. Check browser site settings (often via lock icon for both), global browser camera/microphone settings, and OS camera/microphone permissions. Also ensure the page is served over HTTPS or from localhost.";
        } else if (lowerMessage.includes('no device') || lowerMessage.includes('not found') || lowerMessage.includes('no camera') || lowerMessage.includes('no microphone')) {
            detailedMessage = `No camera or microphone device found or specified. Ensure devices are connected and enabled. (Details: ${err.message})`;
        } else if (lowerMessage.includes('in use') || lowerMessage.includes('busy') || lowerMessage.includes('not available') || lowerMessage.includes('could not start video source') || lowerMessage.includes('could not start audio source')) {
            detailedMessage = `Camera or microphone may be in use by another application, or is otherwise unavailable. Close other apps using these devices and try again. (Details: ${err.message})`;
        } else {
            detailedMessage = `Error accessing camera/microphone: ${err.message}. Ensure HTTPS/localhost and check permissions for both devices.`;
        }
      } else {
        detailedMessage = "An unknown error occurred accessing the camera/microphone. Ensure the page is served over HTTPS or from localhost and check all relevant camera and microphone permissions in your browser and OS.";
      }

      setError(detailedMessage);
      setAppStatus(AppStatus.CameraError);
      setIsCameraEnabled(false);
      setStream(null);
    }
  }, [setStream, setError, setAppStatus, setIsCameraEnabled]);

  const stopUserMedia = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (currentStatus !== AppStatus.CameraError && currentStatus !== AppStatus.Error && currentStatus !== AppStatus.Analyzing) {
         if (!isFeedShared) setAppStatus(AppStatus.Idle);
    }
  }, [stream, setStream, setAppStatus, currentStatus, isFeedShared]);

  useEffect(() => {
    if (isCameraEnabled) {
      startUserMedia();
    } else {
      stopUserMedia();
      if (isFeedShared) {
        onToggleFeedSharing(); 
      }
    }
    return () => {
        if(videoRef.current && videoRef.current.srcObject){ 
             const currentStream = videoRef.current.srcObject as MediaStream;
             currentStream.getTracks().forEach(track => track.stop());
        }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCameraEnabled]); 

  const handleToggleCamera = () => {
    setIsCameraEnabled(prev => !prev);
  };

  const handleCaptureAndAnalyze = () => {
    if (isFeedShared) {
      setError("Cannot analyze while feed is being shared.");
      return;
    }
    if (!videoRef.current || !canvasRef.current || !stream) {
      setError("Camera is not ready or stream is not available.");
      return;
    }
    if (currentStatus === AppStatus.Analyzing) {
      return;
    }
    if (!prompt.trim()) {
      setError("Please enter a prompt for the analysis.");
      return;
    }

    setAppStatus(AppStatus.Capturing);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (context) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
      onCapture(imageDataUrl);
    } else {
      setError("Failed to get canvas context for capture.");
      setAppStatus(AppStatus.CameraReady); 
    }
  };
  
  const isAnalyzing = currentStatus === AppStatus.Analyzing;
  const canCapture = isCameraEnabled && stream && (currentStatus === AppStatus.CameraReady || currentStatus === AppStatus.AnalysisComplete) && !isAnalyzing && !isFeedShared;
  
  let shareButtonText = 'Share My Feed';
  let shareButtonIcon = <SignalIcon className="h-5 w-5 mr-2" aria-hidden="true" />;
  let shareButtonClass = 'bg-teal-500 hover:bg-teal-600';
  let shareButtonDisabled = isAnalyzing || (!isCameraEnabled && !isFeedShared);

  if (isFeedShared) {
    if (connectionStatus === ConnectionStatus.WAITING_FOR_VIEWER) {
      shareButtonText = 'Waiting for Viewer...';
      shareButtonIcon = <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" aria-hidden="true" />;
      shareButtonClass = 'bg-yellow-500 hover:bg-yellow-600';
    } else if (connectionStatus === ConnectionStatus.CONNECTED) {
      shareButtonText = 'Stop Streaming';
      shareButtonIcon = <SignalSlashIcon className="h-5 w-5 mr-2" aria-hidden="true" />;
      shareButtonClass = 'bg-red-500 hover:bg-red-600';
    } else { 
      shareButtonText = 'Stop Sharing Feed';
      shareButtonIcon = <SignalSlashIcon className="h-5 w-5 mr-2" aria-hidden="true" />;
      shareButtonClass = 'bg-red-500 hover:bg-red-600';
    }
  }

  return (
    <div className="bg-gray-800 p-6 rounded-xl shadow-2xl flex flex-col space-y-6">
      <div className="aspect-video bg-gray-700 rounded-lg overflow-hidden shadow-inner relative">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
          aria-label="Camera feed preview"
          muted // Ensure video is muted locally to prevent feedback if audio is captured
        />
        {!isCameraEnabled && currentStatus !== AppStatus.InitializingCamera && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-700 bg-opacity-80 p-4 text-center">
                <VideoCameraSlashIcon className="h-24 w-24 text-gray-500 mb-4" aria-hidden="true" />
                <p className="text-gray-400 text-lg">Camera is off or not accessible.</p>
                {currentStatus === AppStatus.CameraError && <p className="text-xs text-gray-500 mt-1">Check error messages above.</p>}
            </div>
        )}
         {currentStatus === AppStatus.InitializingCamera && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-700 bg-opacity-50">
                <ArrowPathIcon className="h-16 w-16 text-sky-400 animate-spin" />
                <p className="text-sky-300 mt-3">Initializing Camera & Mic...</p>
            </div>
        )}
      </div>
      
      <canvas ref={canvasRef} className="hidden" aria-hidden="true"></canvas>

      {!isFeedShared && (
        <div>
          <label htmlFor="prompt" className="block text-sm font-medium text-sky-300 mb-1">
            AI Analysis Prompt:
          </label>
          <textarea
            id="prompt"
            rows={3}
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition placeholder-gray-500"
            placeholder="e.g., Describe this scene, identify objects..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isAnalyzing || isFeedShared}
            aria-label="AI Analysis Prompt Input"
          />
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
        <button
          onClick={handleToggleCamera}
          disabled={currentStatus === AppStatus.InitializingCamera || isAnalyzing || (isFeedShared && connectionStatus === ConnectionStatus.CONNECTED)}
          className={`w-full sm:w-auto flex-1 flex items-center justify-center px-6 py-3 rounded-lg font-semibold transition-all duration-150 ease-in-out
            ${isCameraEnabled 
              ? 'bg-yellow-500 hover:bg-yellow-600 text-gray-900' 
              : 'bg-green-500 hover:bg-green-600 text-white'}
            ${(currentStatus === AppStatus.InitializingCamera || isAnalyzing || (isFeedShared && connectionStatus === ConnectionStatus.CONNECTED)) ? 'opacity-50 cursor-not-allowed' : 'shadow-md hover:shadow-lg'}`}
          aria-pressed={isCameraEnabled}
        >
          {isCameraEnabled ? <VideoCameraSlashIcon className="h-5 w-5 mr-2" aria-hidden="true" /> : <VideoCameraIcon className="h-5 w-5 mr-2" aria-hidden="true" />}
          {currentStatus === AppStatus.InitializingCamera ? 'Starting...' : (isCameraEnabled ? 'Stop Camera & Mic' : 'Start Camera & Mic')}
        </button>
        
        <button
          onClick={onToggleFeedSharing}
          disabled={shareButtonDisabled}
          className={`w-full sm:w-auto flex-1 flex items-center justify-center px-6 py-3 rounded-lg font-semibold text-white transition-all duration-150 ease-in-out
            ${shareButtonClass}
            ${shareButtonDisabled ? 'opacity-50 cursor-not-allowed' : 'shadow-md hover:shadow-lg'}`}
          aria-pressed={isFeedShared}
        >
          {shareButtonIcon}
          {shareButtonText}
        </button>

        {!isFeedShared && (
          <button
            onClick={handleCaptureAndAnalyze}
            disabled={!canCapture || !prompt.trim()}
            className={`w-full sm:w-auto flex-1 flex items-center justify-center px-6 py-3 rounded-lg font-semibold text-white transition-all duration-150 ease-in-out
              bg-sky-600 hover:bg-sky-700
              ${(!canCapture || !prompt.trim()) ? 'opacity-50 cursor-not-allowed' : 'shadow-md hover:shadow-lg'}`}
          >
            <SparklesIcon className="h-5 w-5 mr-2" aria-hidden="true" />
            {isAnalyzing ? 'Analyzing...' : 'Capture & Analyze'}
          </button>
        )}
      </div>
       {isFeedShared && (
         <p className="text-xs text-yellow-500 text-center mt-2">AI analysis is disabled while sharing feed.</p>
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
    </div>
  );
};
