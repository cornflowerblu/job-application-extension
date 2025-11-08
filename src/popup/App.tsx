import { useState, useEffect } from 'react';

// Import security utilities
import { storeApiKeySecurely, retrieveApiKey } from '../utils/security';
const sanitizeInput = (input: string, maxLength: number = 1000): string => {
  if (!input || typeof input !== 'string') return '';
  return input
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
    .slice(0, maxLength);
};

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validateApiKey = (apiKey: string): boolean => {
  return apiKey.startsWith('sk-ant-') && apiKey.length >= 20 && apiKey.length <= 200;
};

// Type definitions for consistency with other components
interface FormField {
  id: string;
  type: string;
  label: string;
  required: boolean;
  placeholder?: string;
  maxLength?: number | null;
  options?: string[];
}

interface JobPosting {
  title: string;
  description: string;
}

interface ExtractedFormData {
  fields: FormField[];
  jobPosting: JobPosting;
  url: string;
}

interface Fill {
  fieldId: string;
  value: string;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
}

function App() {
  const [isConfigured, setIsConfigured] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ExtractedFormData | null>(null);
  const [fills, setFills] = useState<Fill[]>([]);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    // Check if extension is configured
    retrieveApiKey().then(apiKey => {
      chrome.storage.local.get(['profile'], (result) => {
        setIsConfigured(!!(apiKey && result.profile));
      });
    });
  }, []);

  const handleAnalyzeForm = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get the current active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.id) {
        throw new Error('No active tab found');
      }

      // Send message to content script to analyze form
      const response = await chrome.tabs.sendMessage(tab.id, { type: 'ANALYZE_FORM' });
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to analyze form');
      }

      setFormData(response.data);
      console.log('Form data set, fields found:', response.data.fields.length);

      // Get user profile and generate fills
      const apiKey = await retrieveApiKey();
      const { profile } = await chrome.storage.local.get(['profile']);

      if (!apiKey || !profile) {
        throw new Error('Please configure your API key and profile first');
      }

      console.log('Sending GENERATE_FILLS request to service worker...');
      // Send to service worker for AI processing
      const fillResponse = await chrome.runtime.sendMessage({
        type: 'GENERATE_FILLS',
        formData: response.data,
        profile: profile
      });

      console.log('Received response from service worker:', fillResponse);

      if (!fillResponse.success) {
        throw new Error(fillResponse.error || 'Failed to generate form fills');
      }

      console.log('Setting fills, count:', fillResponse.fills.fills.length);
      setFills(fillResponse.fills.fills);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleFillForm = async () => {
    if (!formData || fills.length === 0) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.id) {
        throw new Error('No active tab found');
      }

      const fillData = fills.map(fill => ({
        fieldId: fill.fieldId,
        value: fill.value
      }));

      const response = await chrome.tabs.sendMessage(tab.id, { 
        type: 'FILL_FORM',
        fills: fillData
      });
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to fill form');
      }

      // Show success message
      setError(null);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fill form');
    } finally {
      setLoading(false);
    }
  };

  if (showSettings) {
    return <SettingsView onBack={() => setShowSettings(false)} onConfigured={() => setIsConfigured(true)} />;
  }

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

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

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

      {formData && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-blue-800 font-medium">
            Form detected: {formData.fields.length} fields found
          </p>
          <p className="text-xs text-blue-600 mt-1">
            Job: {formData.jobPosting.title || 'Unknown'}
          </p>
        </div>
      )}

      {fills.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-green-800 font-medium">
            AI suggestions ready: {fills.length} fields
          </p>
          <div className="mt-2 space-y-1">
            {fills.slice(0, 3).map((fill, idx) => (
              <div key={idx} className="text-xs text-green-600">
                {formData?.fields.find(f => f.id === fill.fieldId)?.label}: {fill.value.slice(0, 50)}...
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <button
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          onClick={() => setShowSettings(true)}
        >
          Settings
        </button>

        <button
          className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!isConfigured || loading}
          onClick={handleAnalyzeForm}
        >
          {loading ? 'Analyzing...' : 'Analyze Form on This Page'}
        </button>

        {fills.length > 0 && (
          <button
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
            onClick={handleFillForm}
          >
            {loading ? 'Filling...' : 'Fill Form with AI Suggestions'}
          </button>
        )}
      </div>

      <div className="mt-6 text-xs text-gray-500 text-center">
        Version 0.1.0 (MVP)
      </div>
    </div>
  );
}

// Settings component
function SettingsView({ onBack, onConfigured }: { onBack: () => void; onConfigured: () => void }) {
  const [apiKey, setApiKey] = useState('');
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    resume: '',
    workAuthorization: '',
    willingToRelocate: '',
    gender: '',
    race: '',
    veteranStatus: '',
    disabilityStatus: ''
  });
  const [keyboardShortcutsEnabled, setKeyboardShortcutsEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Load existing settings
    retrieveApiKey().then(key => {
      if (key) setApiKey(key);
    });
    chrome.storage.local.get(['profile', 'keyboardShortcutsEnabled'], (result) => {
      if (result.profile) setProfile({ ...profile, ...result.profile });
      if (result.keyboardShortcutsEnabled !== undefined) {
        setKeyboardShortcutsEnabled(result.keyboardShortcutsEnabled);
      }
    });
  }, []);

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const sanitizedApiKey = sanitizeInput(apiKey, 200);
      const sanitizedProfile = {
        name: sanitizeInput(profile.name, 100),
        email: sanitizeInput(profile.email, 254),
        phone: sanitizeInput(profile.phone, 20),
        resume: sanitizeInput(profile.resume, 20000),
        workAuthorization: sanitizeInput(profile.workAuthorization, 100),
        willingToRelocate: sanitizeInput(profile.willingToRelocate, 100),
        gender: sanitizeInput(profile.gender, 100),
        race: sanitizeInput(profile.race, 100),
        veteranStatus: sanitizeInput(profile.veteranStatus, 100),
        disabilityStatus: sanitizeInput(profile.disabilityStatus, 100)
      };

      // Validation
      if (!sanitizedApiKey) {
        throw new Error('API key is required');
      }

      if (!validateApiKey(sanitizedApiKey)) {
        throw new Error('Invalid API key format. Should start with "sk-ant-" and be between 20-200 characters.');
      }

      if (!sanitizedProfile.name) {
        throw new Error('Name is required');
      }

      if (!sanitizedProfile.email) {
        throw new Error('Email is required');
      }

      if (!validateEmail(sanitizedProfile.email)) {
        throw new Error('Please enter a valid email address');
      }

      // Validate API key with service
      const validationResponse = await chrome.runtime.sendMessage({
        type: 'VALIDATE_API_KEY',
        apiKey: sanitizedApiKey
      });

      if (!validationResponse.success) {
        throw new Error(validationResponse.error || 'Failed to validate API key');
      }

      if (!validationResponse.isValid) {
        throw new Error('Invalid API key. Please check your Anthropic API key.');
      }

      // Save settings with encrypted API key
      await storeApiKeySecurely(sanitizedApiKey);
      await chrome.storage.local.set({
        profile: sanitizedProfile,
        keyboardShortcutsEnabled: keyboardShortcutsEnabled
      });

      setSuccess(true);
      onConfigured();
      
      // Auto-close after successful save
      setTimeout(() => {
        onBack();
      }, 1500);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-96 min-h-96 p-6 bg-gray-50">
      <div className="mb-6">
        <button
          onClick={onBack}
          className="text-blue-600 hover:text-blue-700 text-sm mb-2"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-green-800">Settings saved successfully!</p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Anthropic API Key *
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="sk-ant-..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full Name *
          </label>
          <input
            type="text"
            value={profile.name}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email *
          </label>
          <input
            type="email"
            value={profile.email}
            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone
          </label>
          <input
            type="tel"
            value={profile.phone}
            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Resume/Experience Summary
          </label>
          <textarea
            value={profile.resume}
            onChange={(e) => setProfile({ ...profile, resume: e.target.value })}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Brief summary of your experience and skills..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Work Authorization
          </label>
          <select
            value={profile.workAuthorization}
            onChange={(e) => setProfile({ ...profile, workAuthorization: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select...</option>
            <option value="US Citizen">US Citizen</option>
            <option value="Permanent Resident">Permanent Resident</option>
            <option value="H1B">H1B</option>
            <option value="F1 OPT">F1 OPT</option>
            <option value="Require Sponsorship">Require Sponsorship</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Willing to Relocate
          </label>
          <select
            value={profile.willingToRelocate}
            onChange={(e) => setProfile({ ...profile, willingToRelocate: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select...</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
            <option value="Depends on location">Depends on location</option>
          </select>
        </div>

        <div className="border-t border-gray-200 pt-4 mt-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Keyboard Shortcuts</h3>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Enable Keyboard Shortcuts</p>
                <p className="text-xs text-gray-600 mt-1">
                  Press <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs font-mono">Ctrl+Shift+E</kbd> (or <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs font-mono">⌘+Shift+E</kbd> on Mac) to analyze forms
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={keyboardShortcutsEnabled}
                  onChange={(e) => setKeyboardShortcutsEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              You can customize shortcuts in chrome://extensions/shortcuts
            </p>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4 mt-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Equal Employment Opportunity (Optional)</h3>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Gender
            </label>
            <select
              value={profile.gender}
              onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select...</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Non-binary">Non-binary</option>
              <option value="Prefer not to answer">Prefer not to answer</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Race/Ethnicity
            </label>
            <select
              value={profile.race}
              onChange={(e) => setProfile({ ...profile, race: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select...</option>
              <option value="Hispanic or Latino">Hispanic or Latino</option>
              <option value="White">White</option>
              <option value="Black or African American">Black or African American</option>
              <option value="Native Hawaiian or Other Pacific Islander">Native Hawaiian or Other Pacific Islander</option>
              <option value="Asian">Asian</option>
              <option value="American Indian or Alaska Native">American Indian or Alaska Native</option>
              <option value="Two or More Races">Two or More Races</option>
              <option value="Prefer not to answer">Prefer not to answer</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Veteran Status
            </label>
            <select
              value={profile.veteranStatus}
              onChange={(e) => setProfile({ ...profile, veteranStatus: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select...</option>
              <option value="I am not a protected veteran">I am not a protected veteran</option>
              <option value="I identify as one or more of the classifications of a protected veteran">I identify as one or more of the classifications of a protected veteran</option>
              <option value="Prefer not to answer">Prefer not to answer</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Disability Status
            </label>
            <select
              value={profile.disabilityStatus}
              onChange={(e) => setProfile({ ...profile, disabilityStatus: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select...</option>
              <option value="Yes, I have a disability (or previously had a disability)">Yes, I have a disability (or previously had a disability)</option>
              <option value="No, I do not have a disability">No, I do not have a disability</option>
              <option value="Prefer not to answer">Prefer not to answer</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}

export default App;
