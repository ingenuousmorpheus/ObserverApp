import { GoogleGenAI, Part } from "@google/genai";

// IMPORTANT: API_KEY handling.
// In a typical frontend setup (like Vite or Create React App), environment variables
// are prefixed (e.g., VITE_GEMINI_API_KEY) and embedded during build.
// `process.env.API_KEY` as used here implies a Node.js environment or specific build setup.
// For this exercise, we assume `process.env.API_KEY` is correctly populated in the execution environment.
// If this were a pure client-side build without specific env var injection, this would not work directly.
// Consider using import.meta.env.VITE_API_KEY (for Vite) or similar for client-side builds.
const API_KEY = process.env.API_KEY;

let ai: GoogleGenAI | null = null;

if (API_KEY) {
  ai = new GoogleGenAI({ apiKey: API_KEY });
} else {
  console.warn(
    "Gemini API Key is not found. Please set the API_KEY environment variable. " +
    "API calls will fail. Make sure your build process makes this available, e.g. as process.env.API_KEY or import.meta.env.VITE_API_KEY for Vite."
  );
}

const imageToGenerativePart = (imageDataUrl: string): Part => {
  const match = imageDataUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,(.*)$/);
  if (!match) {
    throw new Error('Invalid image data URL format. Must start with data:image/(jpeg|png|webp);base64,...');
  }
  const mimeType = match[1];
  const base64Data = match[2];
  return {
    inlineData: {
      mimeType,
      data: base64Data,
    },
  };
};

export const analyzeImageWithGemini = async (imageDataUrl: string, textPrompt: string): Promise<string> => {
  if (!ai) {
    throw new Error("Gemini API client is not initialized. Check API_KEY configuration.");
  }
  if (!textPrompt || textPrompt.trim() === "") {
    throw new Error("Text prompt cannot be empty.");
  }

  try {
    const imagePart = imageToGenerativePart(imageDataUrl);
    const textPart = { text: textPrompt };

    // Using the specified multimodal model
    const model = 'gemini-2.5-flash-preview-04-17';
    
    const response = await ai.models.generateContent({
        model: model,
        contents: { parts: [imagePart, textPart] },
        // No specific config like systemInstruction, topK etc. are added here for simplicity,
        // but could be added to the config object if needed.
        // Example: config: { temperature: 0.7 }
    });
    
    // Directly access the text property as per guidance
    const analysisText = response.text;
    if (typeof analysisText !== 'string') {
        console.warn("Gemini API response.text was not a string:", analysisText);
        throw new Error("Received an unexpected response format from Gemini API.");
    }
    return analysisText;

  } catch (error: any) {
    console.error("Error calling Gemini API:", error);
    let errorMessage = "An unknown error occurred with the Gemini API.";
    if (error.message) {
        errorMessage = error.message;
    }
    // Check for common API key issues (though SDK might handle some of this)
    if (errorMessage.toLowerCase().includes("api key") || errorMessage.toLowerCase().includes("permission denied")) {
        errorMessage = "Invalid or missing Gemini API Key. Please check your configuration. Original error: " + errorMessage;
    } else if (errorMessage.toLowerCase().includes("quota")) {
        errorMessage = "Gemini API quota exceeded. Please check your usage limits. Original error: " + errorMessage;
    }
    
    throw new Error(errorMessage);
  }
};
