import React, { useState, useEffect } from 'react';

function App() {
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    // Check if extension is configured
    chrome.storage.local.get(['apiKey', 'profile'], (result) => {
      setIsConfigured(!!(result.apiKey && result.profile));
    });
  }, []);

  return (
    <div className="w-96 min-h-96 p-6 bg-gray-50">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Job Application Assistant
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          AI-powered form filling with Claude
        </p>
      </div>

      {!isConfigured ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-yellow-800">
            Please configure your settings to get started.
          </p>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-green-800">
            Extension configured and ready to use!
          </p>
        </div>
      )}

      <div className="space-y-3">
        <button
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          onClick={() => {
            // TODO: Navigate to settings
            console.log('Open settings');
          }}
        >
          Settings
        </button>

        <button
          className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!isConfigured}
          onClick={() => {
            // TODO: Trigger form detection on current page
            console.log('Analyze form');
          }}
        >
          Analyze Form on This Page
        </button>
      </div>

      <div className="mt-6 text-xs text-gray-500 text-center">
        Version 0.1.0 (MVP)
      </div>
    </div>
  );
}

export default App;
