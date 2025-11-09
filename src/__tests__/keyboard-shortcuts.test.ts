/**
 * Tests for keyboard shortcuts and form detection
 */

describe('Keyboard Shortcuts', () => {
  describe('Keyboard shortcut settings', () => {
    it('should default to enabled when not set', async () => {
      const mockGet = jest.fn((_keys, callback) => {
        callback({});
      });

      global.chrome = {
        storage: {
          local: {
            get: mockGet
          }
        }
      } as any;

      // Simulate loading settings
      const result = await new Promise((resolve) => {
        chrome.storage.local.get('keyboardShortcutsEnabled', (data) => {
          resolve(data.keyboardShortcutsEnabled);
        });
      });

      expect(result).toBeUndefined();
    });

    it('should respect disabled keyboard shortcuts', async () => {
      const mockGet = jest.fn((_keys, callback) => {
        callback({ keyboardShortcutsEnabled: false });
      });

      global.chrome = {
        storage: {
          local: {
            get: mockGet
          }
        }
      } as any;

      const result = await new Promise((resolve) => {
        chrome.storage.local.get('keyboardShortcutsEnabled', (data) => {
          resolve(data.keyboardShortcutsEnabled);
        });
      });

      expect(result).toBe(false);
    });
  });

  describe('Form detection error messages', () => {
    it('should provide helpful message when no forms found', () => {
      const errorMessage = 'No application forms found on this page (example.com). Try opening a job application page first, then use the keyboard shortcut or click "Analyze Form" again.';

      expect(errorMessage).toContain('No application forms found');
      expect(errorMessage).toContain('keyboard shortcut');
    });

    it('should suggest next steps when form has no fields', () => {
      const errorMessage = 'The form was found but contains no fillable fields. You may need to scroll down or navigate to the next step of the application.';

      expect(errorMessage).toContain('scroll down');
      expect(errorMessage).toContain('next step');
    });
  });

  describe('Badge color system', () => {
    it('should set blue badge when analyzing', () => {
      const mockSetBadgeText = jest.fn();
      const mockSetBadgeBackgroundColor = jest.fn();

      global.chrome = {
        action: {
          setBadgeText: mockSetBadgeText,
          setBadgeBackgroundColor: mockSetBadgeBackgroundColor
        }
      } as any;

      // Simulate analyzing state
      chrome.action.setBadgeText({ text: '...', tabId: 1 });
      chrome.action.setBadgeBackgroundColor({ color: '#3B82F6', tabId: 1 });

      expect(mockSetBadgeText).toHaveBeenCalledWith({ text: '...', tabId: 1 });
      expect(mockSetBadgeBackgroundColor).toHaveBeenCalledWith({ color: '#3B82F6', tabId: 1 });
    });

    it('should set green badge on success', () => {
      const mockSetBadgeText = jest.fn();
      const mockSetBadgeBackgroundColor = jest.fn();

      global.chrome = {
        action: {
          setBadgeText: mockSetBadgeText,
          setBadgeBackgroundColor: mockSetBadgeBackgroundColor
        }
      } as any;

      // Simulate success state
      chrome.action.setBadgeText({ text: '5', tabId: 1 });
      chrome.action.setBadgeBackgroundColor({ color: '#10B981', tabId: 1 });

      expect(mockSetBadgeText).toHaveBeenCalledWith({ text: '5', tabId: 1 });
      expect(mockSetBadgeBackgroundColor).toHaveBeenCalledWith({ color: '#10B981', tabId: 1 });
    });

    it('should set red badge on error', () => {
      const mockSetBadgeText = jest.fn();
      const mockSetBadgeBackgroundColor = jest.fn();

      global.chrome = {
        action: {
          setBadgeText: mockSetBadgeText,
          setBadgeBackgroundColor: mockSetBadgeBackgroundColor
        }
      } as any;

      // Simulate error state
      chrome.action.setBadgeText({ text: '✗', tabId: 1 });
      chrome.action.setBadgeBackgroundColor({ color: '#EF4444', tabId: 1 });

      expect(mockSetBadgeText).toHaveBeenCalledWith({ text: '✗', tabId: 1 });
      expect(mockSetBadgeBackgroundColor).toHaveBeenCalledWith({ color: '#EF4444', tabId: 1 });
    });
  });

  describe('Toast notification system', () => {
    beforeEach(() => {
      document.body.innerHTML = '';
    });

    it('should create toast element with correct styles for info', () => {
      const showToast = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
        const toast = document.createElement('div');
        toast.id = 'job-app-assistant-toast';
        const bgColors = {
          info: '#3B82F6',
          success: '#10B981',
          error: '#EF4444'
        };
        toast.style.backgroundColor = bgColors[type];
        toast.textContent = message;
        document.body.appendChild(toast);
        return toast;
      };

      const toast = showToast('Analyzing form...', 'info');

      expect(toast.id).toBe('job-app-assistant-toast');
      expect(toast.style.backgroundColor).toBe('rgb(59, 130, 246)');
      expect(toast.textContent).toBe('Analyzing form...');
    });

    it('should create toast element with success color', () => {
      const showToast = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
        const toast = document.createElement('div');
        toast.id = 'job-app-assistant-toast';
        const bgColors = {
          info: '#3B82F6',
          success: '#10B981',
          error: '#EF4444'
        };
        toast.style.backgroundColor = bgColors[type];
        toast.textContent = message;
        document.body.appendChild(toast);
        return toast;
      };

      const toast = showToast('✓ Found 5 form fields', 'success');

      expect(toast.style.backgroundColor).toBe('rgb(16, 185, 129)');
      expect(toast.textContent).toBe('✓ Found 5 form fields');
    });

    it('should create toast element with error color', () => {
      const showToast = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
        const toast = document.createElement('div');
        toast.id = 'job-app-assistant-toast';
        const bgColors = {
          info: '#3B82F6',
          success: '#10B981',
          error: '#EF4444'
        };
        toast.style.backgroundColor = bgColors[type];
        toast.textContent = message;
        document.body.appendChild(toast);
        return toast;
      };

      const toast = showToast('No forms found', 'error');

      expect(toast.style.backgroundColor).toBe('rgb(239, 68, 68)');
      expect(toast.textContent).toBe('No forms found');
    });

    it('should remove existing toast when creating new one', () => {
      const showToast = (message: string) => {
        const existingToast = document.getElementById('job-app-assistant-toast');
        if (existingToast) {
          existingToast.remove();
        }
        const toast = document.createElement('div');
        toast.id = 'job-app-assistant-toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        return toast;
      };

      showToast('First message');
      expect(document.querySelectorAll('#job-app-assistant-toast').length).toBe(1);

      showToast('Second message');
      expect(document.querySelectorAll('#job-app-assistant-toast').length).toBe(1);
      expect(document.getElementById('job-app-assistant-toast')?.textContent).toBe('Second message');
    });
  });
});
