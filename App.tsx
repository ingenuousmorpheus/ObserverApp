
import React, { useState, useCallback, useEffect } from 'react';
import { CameraView } from './components/CameraView';
import { ResultView } from './components/ResultView';
import { Header } from './components/Header';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorDisplay } from './components/ErrorDisplay';
import { RoleSelectionView } from './components/RoleSelectionView';
import { ViewerView } from './components/ViewerView';
import { analyzeImageWithGemini } from './services/geminiService';
import { AppStatus, AnalysisResult, UserRole, ConnectionStatus } from './types';

const App: React.FC = (): JSX.Element => {
  const [userRole, setUserRole] = useState<UserRole>(UserRole.NONE);
  const [appStatus, setAppStatus] = useState<AppStatus>(AppStatus.Idle);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
  
  const [currentError, setCurrentError] = useState<string | null>(null);
  const [latestAnalysis, setLatestAnalysis] = useState<AnalysisResult | null>(null);
  
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [isCameraEnabled, setIsCameraEnabled] = useState<boolean>(false);
  const [analysisPrompt, setAnalysisPrompt] = useState<string>("Describe this image in detail.");
  
  // States for P2P simulation
  const [isFeedShared, setIsFeedShared] = useState<boolean>(false); // Camera role: is sharing initiated
  const [pairingCode, setPairingCode] = useState<string | null>(null); // Camera role: generated code
  const [viewerInputCode, setViewerInputCode] = useState<string>(''); // Viewer role: code entered by viewer

  const clearError = useCallback(() => {
    setCurrentError(null);
    if(appStatus === AppStatus.Error || appStatus === AppStatus.CameraError) {
        if (appStatus === AppStatus.CameraError && !isCameraEnabled) {
             setAppStatus(AppStatus.Idle);
        } else if (appStatus === AppStatus.CameraError && isCameraEnabled) {
            setAppStatus(AppStatus.Idle);
            setIsCameraEnabled(false); 
        } else {
             setAppStatus(AppStatus.Idle);
        }
    }
  }, [appStatus, isCameraEnabled]);

  const handleSetUserRole = (role: UserRole) => {
    setUserRole(role);
    setAppStatus(AppStatus.Idle);
    setConnectionStatus(ConnectionStatus.DISCONNECTED);
    setIsFeedShared(false);
    setPairingCode(null);
    setViewerInputCode('');
    setCurrentError(null);
    setLatestAnalysis(null);
    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
    }
    setMediaStream(null);
    setIsCameraEnabled(false);
  };

  const handleGoBackToRoleSelection = useCallback(() => {
    handleSetUserRole(UserRole.NONE);
  }, []); // No dependencies as handleSetUserRole is stable or defined outside typical render cycle impact

  const handleAnalysisRequest = async (imageDataUrl: string) => {
    if (userRole === UserRole.VIEWER || isFeedShared) {
        setCurrentError("AI analysis is not available while streaming or viewing.");
        return;
    }
    if (!analysisPrompt.trim()) {
      setCurrentError("Please enter a prompt for the AI analysis.");
      setAppStatus(isCameraEnabled ? AppStatus.CameraReady : AppStatus.Idle);
      return;
    }
    
    setAppStatus(AppStatus.Analyzing);
    setCurrentError(null);

    try {
      const description = await analyzeImageWithGemini(imageDataUrl, analysisPrompt);
      const newAnalysis: AnalysisResult = {
        id: Date.now().toString(),
        imageUrl: imageDataUrl,
        prompt: analysisPrompt,
        description,
        timestamp: new Date(),
      };
      setLatestAnalysis(newAnalysis);
      setAppStatus(AppStatus.AnalysisComplete);
    } catch (err: any) {
      console.error("Gemini API error:", err);
      setCurrentError(`Analysis failed: ${err.message || 'Unknown error'}`);
      setAppStatus(AppStatus.Error);
    }
  };

  const generatePairingCode = (): string => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleToggleFeedSharing = useCallback(() => {
    if (!isCameraEnabled && !isFeedShared) {
      setCurrentError("Please start your camera before sharing the feed.");
      setAppStatus(AppStatus.CameraError); 
      return;
    }

    setIsFeedShared(prev => {
      const newSharingState = !prev;
      if (newSharingState) {
        const newCode = generatePairingCode();
        setPairingCode(newCode);
        setConnectionStatus(ConnectionStatus.WAITING_FOR_VIEWER);
        console.log("Camera started sharing with code:", newCode); 
      } else {
        setPairingCode(null);
        setConnectionStatus(ConnectionStatus.DISCONNECTED);
      }
      return newSharingState;
    });
  }, [isCameraEnabled, setAppStatus]); 

  const handleViewerConnect = () => {
    if (!viewerInputCode.trim()) {
      setCurrentError("Please enter a pairing code.");
      setConnectionStatus(ConnectionStatus.DISCONNECTED);
      return;
    }
    setConnectionStatus(ConnectionStatus.ATTEMPTING_CONNECTION);
    setCurrentError(null);
    
    console.log(`Viewer attempts to connect with code: ${viewerInputCode}. Camera's code for simulation: ${pairingCode}`);

    setTimeout(() => {
      // Simulate using a global or passed pairingCode for Viewer to check against
      // This is a placeholder. In a real app, this code would come from a server or P2P connection.
      // For this simulation, we'll assume CameraView has set a `pairingCode` that ViewerView can somehow access.
      // This is a simplification for local simulation.
      // Let's assume `pairingCode` is accessible here if the Camera role set it.
      // For this example, we'll need to adjust how pairingCode is known to the viewer logic,
      // or pass it through some shared state if we were to make this more robust locally.
      // The current structure relies on `App.tsx`'s `pairingCode` state.
      if (pairingCode && viewerInputCode === pairingCode) { 
        setConnectionStatus(ConnectionStatus.CONNECTED);
      } else {
        setConnectionStatus(ConnectionStatus.INVALID_CODE);
        setCurrentError("Invalid or expired pairing code. Please check the code and try again.");
      }
    }, 1000);
  };
  
  useEffect(() => {
    if (userRole === UserRole.CAMERA && connectionStatus === ConnectionStatus.CONNECTED && isFeedShared) {
        // Viewer connected logic for camera side
    }
  }, [userRole, connectionStatus, isFeedShared, pairingCode, viewerInputCode]);


  const renderContent = () => {
    if (userRole === UserRole.NONE) {
      return <RoleSelectionView onSelectRole={handleSetUserRole} />;
    }

    if (userRole === UserRole.CAMERA) {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <CameraView
            onCapture={handleAnalysisRequest}
            currentStatus={appStatus}
            setAppStatus={setAppStatus}
            setError={setCurrentError}
            stream={mediaStream}
            setStream={setMediaStream}
            isCameraEnabled={isCameraEnabled}
            setIsCameraEnabled={setIsCameraEnabled}
            prompt={analysisPrompt}
            setPrompt={setAnalysisPrompt}
            isFeedShared={isFeedShared}
            onToggleFeedSharing={handleToggleFeedSharing}
            pairingCode={pairingCode}
            connectionStatus={connectionStatus}
            userRole={userRole}
            onBackToRoleSelection={handleGoBackToRoleSelection}
          />
          <div className="bg-gray-800 p-6 rounded-xl shadow-2xl flex flex-col min-h-[300px] lg:min-h-[calc(var(--camera-view-height,600px))] justify-center">
            {appStatus === AppStatus.Analyzing && (
              <LoadingSpinner text="Gemini is analyzing the image..." />
            )}
            {(appStatus === AppStatus.AnalysisComplete || appStatus === AppStatus.CameraReady || appStatus === AppStatus.Idle || appStatus === AppStatus.CameraError || appStatus === AppStatus.Error) && latestAnalysis && !isFeedShared && (
              <ResultView result={latestAnalysis} />
            )}
            {appStatus !== AppStatus.Analyzing && !latestAnalysis && !isFeedShared && !(appStatus === AppStatus.CameraError && currentError) && (
                 <div className="text-center text-gray-500">
                    <p className="text-xl">AI Analysis results will appear here.</p>
                    <p>Start your camera, enter a prompt, and capture an image.</p>
                 </div>
            )}
             {isFeedShared && connectionStatus === ConnectionStatus.WAITING_FOR_VIEWER && (
                <div className="text-center text-sky-400 p-4">
                    <LoadingSpinner text="Waiting for viewer..." />
                    <p className="text-2xl font-bold mt-4 break-all">Pairing Code: {pairingCode}</p>
                    <p className="text-sm text-gray-400 mt-2">(Share this code with your viewer)</p>
                </div>
            )}
            {isFeedShared && connectionStatus === ConnectionStatus.CONNECTED && (
                <div className="text-center text-green-400 p-4">
                    <ViewIcon className="h-16 w-16 mx-auto mb-4" />
                    <p className="text-2xl font-bold">Viewer Connected!</p>
                    <p className="text-sm text-gray-400 mt-2">(Your feed is being "streamed")</p>
                </div>
            )}
             {appStatus === AppStatus.CameraError && currentError && !isFeedShared && (
                <div className="text-center text-red-400 p-4">
                    <p className="font-semibold">Camera Issue</p>
                </div>
             )}
          </div>
        </div>
      );
    }

    if (userRole === UserRole.VIEWER) {
      return (
        <ViewerView
            stream={connectionStatus === ConnectionStatus.CONNECTED ? mediaStream : null} // Simulate stream by passing camera's stream
            connectionStatus={connectionStatus}
            onConnect={handleViewerConnect}
            inputCode={viewerInputCode}
            setInputCode={setViewerInputCode}
            onStopViewing={() => { 
                setConnectionStatus(ConnectionStatus.DISCONNECTED);
                setViewerInputCode('');
                setCurrentError(null);
            }}
            onBackToRoleSelection={handleGoBackToRoleSelection}
        />
      );
    }
    return null; 
  };

  return (
    <div className="min-h-screen bg-black text-gray-100 flex flex-col items-center p-4 pt-8 md:p-8">
      <Header />
      
      <main className="w-full max-w-6xl mx-auto space-y-8">
        {currentError && <ErrorDisplay message={currentError} onClear={clearError} />}
        {renderContent()}
      </main>
      <footer className="w-full max-w-6xl mx-auto text-center py-8 mt-8 text-gray-500 text-sm">
        <p>Observer App &copy; {new Date().getFullYear()}.</p>
        {(userRole === UserRole.CAMERA && isFeedShared) || userRole === UserRole.VIEWER ? (
            <p className="text-xs text-yellow-400">(P2P Streaming is Simulated. No actual remote connection established.)</p>
        ) : null}
         <p className="text-xs text-orange-400 mt-2">
            <strong>Camera Tip:</strong> For camera access, ensure this page is served over <strong>HTTPS</strong> or from <strong>localhost</strong>.
            Check browser and OS permissions if you encounter issues.
        </p>
      </footer>
    </div>
  );
};

const ViewIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  );

export default App;