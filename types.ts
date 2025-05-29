export interface AnalysisResult {
  id: string;
  imageUrl: string; // data URL of the captured image
  prompt: string;
  description: string; // Gemini's response
  timestamp: Date;
}

export enum AppStatus {
  Idle = 'Idle',
  InitializingCamera = 'InitializingCamera',
  CameraReady = 'CameraReady',
  CameraError = 'CameraError',
  Capturing = 'Capturing', // Momentary state
  Analyzing = 'Analyzing',
  AnalysisComplete = 'AnalysisComplete',
  Error = 'Error', // General/API errors
}

export enum UserRole {
  NONE = 'NONE', // Initial state, role not yet selected
  CAMERA = 'CAMERA', // User is the camera, sharing their feed
  VIEWER = 'VIEWER', // User is viewing a remote feed
}

export enum ConnectionStatus {
  DISCONNECTED = 'DISCONNECTED',
  WAITING_FOR_VIEWER = 'WAITING_FOR_VIEWER', // Camera is waiting for viewer to connect with code
  ATTEMPTING_CONNECTION = 'ATTEMPTING_CONNECTION', // Viewer has entered code and is trying to connect
  CONNECTED = 'CONNECTED', // Simulated connection established
  INVALID_CODE = 'INVALID_CODE', // Viewer entered an invalid code
}
