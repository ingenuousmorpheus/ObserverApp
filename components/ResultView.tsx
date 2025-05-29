import React from 'react';
import { AnalysisResult } from '../types';
import { DocumentArrowDownIcon, ChatBubbleBottomCenterTextIcon, TagIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';

interface ResultViewProps {
  result: AnalysisResult | null;
}

export const ResultView: React.FC<ResultViewProps> = ({ result }) => {
  if (!result) {
    return (
      <div className="text-center text-gray-500 p-8">
        <p className="text-xl">No analysis result to display.</p>
        <p>Capture an image and provide a prompt to see results here.</p>
      </div>
    );
  }

  const { imageUrl, prompt, description, timestamp, id } = result;

  return (
    <div className="bg-gray-800 rounded-xl overflow-hidden shadow-xl h-full flex flex-col">
      <div className="p-6 space-y-5 flex-grow overflow-y-auto">
        <div>
            <img src={imageUrl} alt="Captured analysis subject" className="rounded-lg shadow-lg w-full object-contain max-h-80 mb-4 border-2 border-gray-700" />
            <a
              href={imageUrl}
              download={`gemini-vision-${id}.jpg`}
              className="inline-flex items-center justify-center w-full px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md shadow-sm transition duration-150 ease-in-out text-sm"
            >
              <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
              Download Image
            </a>
        </div>
        
        <div className="space-y-1">
            <h3 className="text-sm font-semibold text-sky-400 flex items-center">
              <TagIcon className="h-5 w-5 mr-2 text-sky-500"/> Prompt Used:
            </h3>
            <p className="text-gray-300 bg-gray-700 p-3 rounded-md text-sm">{prompt}</p>
        </div>

        <div className="space-y-1">
            <h3 className="text-sm font-semibold text-sky-400 flex items-center">
                <ChatBubbleBottomCenterTextIcon className="h-5 w-5 mr-2 text-sky-500"/>Gemini's Analysis:
            </h3>
            <div className="text-gray-200 bg-gray-700 p-3 rounded-md text-sm leading-relaxed whitespace-pre-wrap min-h-[100px]">
              {description || "No description provided."}
            </div>
        </div>
        
        <div className="text-xs text-gray-500 flex items-center pt-2">
          <CalendarDaysIcon className="h-4 w-4 mr-1.5"/>
          Analyzed on: {new Date(timestamp).toLocaleString()}
        </div>
      </div>
    </div>
  );
};
