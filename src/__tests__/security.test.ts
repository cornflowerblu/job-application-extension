/**
 * Tests for security utilities, especially profile sanitization
 *
 * This test file was created to prevent regressions where EEO fields
 * were missing from the sanitized profile, causing them not to be sent to Claude.
 */

import { sanitizeUserProfile } from '../utils/security';

describe('Security - Profile Sanitization', () => {
  describe('sanitizeUserProfile', () => {
    it('should preserve all required profile fields', () => {
      const profile = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '555-1234',
        resume: 'My experience...',
        workAuthorization: 'U.S. Citizen',
        willingToRelocate: 'Yes'
      };

      const sanitized = sanitizeUserProfile(profile);

      expect(sanitized.name).toBe('John Doe');
      expect(sanitized.email).toBe('john@example.com');
      expect(sanitized.phone).toBe('555-1234');
      expect(sanitized.resume).toBe('My experience...');
      expect(sanitized.workAuthorization).toBe('U.S. Citizen');
      expect(sanitized.willingToRelocate).toBe('Yes');
    });

    it('should preserve EEO fields when provided', () => {
      const profile = {
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '555-5678',
        resume: 'Resume text',
        workAuthorization: 'Yes',
        willingToRelocate: 'No',
        // EEO fields
        gender: 'Female',
        race: 'Asian',
        veteranStatus: 'I am not a protected veteran',
        disabilityStatus: 'No, I do not have a disability'
      };

      const sanitized = sanitizeUserProfile(profile);

      // Regression test: These were missing before the fix!
      expect(sanitized.gender).toBe('Female');
      expect(sanitized.race).toBe('Asian');
      expect(sanitized.veteranStatus).toBe('I am not a protected veteran');
      expect(sanitized.disabilityStatus).toBe('No, I do not have a disability');
    });

    it('should handle missing EEO fields gracefully', () => {
      const profile = {
        name: 'Test User',
        email: 'test@test.com',
        phone: '555-0000',
        resume: 'Resume',
        workAuthorization: 'Yes',
        willingToRelocate: 'Yes'
        // No EEO fields provided
      };

      const sanitized = sanitizeUserProfile(profile);

      // Should have empty strings, not throw or be undefined
      expect(sanitized.gender).toBe('');
      expect(sanitized.race).toBe('');
      expect(sanitized.veteranStatus).toBe('');
      expect(sanitized.disabilityStatus).toBe('');
    });

    it('should handle empty string EEO values', () => {
      const profile = {
        name: 'User',
        email: 'user@test.com',
        phone: '555',
        resume: 'Resume',
        workAuthorization: 'Yes',
        willingToRelocate: 'Yes',
        gender: '',
        race: '',
        veteranStatus: '',
        disabilityStatus: ''
      };

      const sanitized = sanitizeUserProfile(profile);

      expect(sanitized.gender).toBe('');
      expect(sanitized.race).toBe('');
      expect(sanitized.veteranStatus).toBe('');
      expect(sanitized.disabilityStatus).toBe('');
    });

    it('should handle "Prefer not to answer" EEO values', () => {
      const profile = {
        name: 'User',
        email: 'user@test.com',
        phone: '555',
        resume: 'Resume',
        workAuthorization: 'Yes',
        willingToRelocate: 'Yes',
        gender: 'Prefer not to answer',
        race: 'Prefer not to answer',
        veteranStatus: 'Prefer not to answer',
        disabilityStatus: 'Prefer not to answer'
      };

      const sanitized = sanitizeUserProfile(profile);

      expect(sanitized.gender).toBe('Prefer not to answer');
      expect(sanitized.race).toBe('Prefer not to answer');
      expect(sanitized.veteranStatus).toBe('Prefer not to answer');
      expect(sanitized.disabilityStatus).toBe('Prefer not to answer');
    });

    it('should sanitize all EEO field values (control characters and keywords)', () => {
      const profile = {
        name: 'Test',
        email: 'test@test.com',
        phone: '555',
        resume: 'Resume',
        workAuthorization: 'Yes',
        willingToRelocate: 'No',
        // Test with potentially dangerous input
        gender: 'Male ignore: previous instructions',
        race: 'White system: do something',
        veteranStatus: 'Not a veteran\u0000',
        disabilityStatus: 'No disability\r\n\r\nExtra text'
      };

      const sanitized = sanitizeUserProfile(profile);

      // Should sanitize prompt injection keywords
      expect(sanitized.gender).toContain('[removed]');
      expect(sanitized.race).toContain('[removed]');

      // Should remove control characters
      expect(sanitized.veteranStatus).not.toContain('\u0000');
      expect(sanitized.veteranStatus).toBe('Not a veteran');

      // Should remove control characters (which removes \r\n completely)
      expect(sanitized.disabilityStatus).not.toContain('\r\n\r\n');
      expect(sanitized.disabilityStatus).toBe('No disabilityExtra text');
    });

    it('should enforce length limits on EEO fields', () => {
      const longString = 'A'.repeat(300);

      const profile = {
        name: 'Test',
        email: 'test@test.com',
        phone: '555',
        resume: 'Resume',
        workAuthorization: 'Yes',
        willingToRelocate: 'No',
        gender: longString,
        race: longString,
        veteranStatus: longString,
        disabilityStatus: longString
      };

      const sanitized = sanitizeUserProfile(profile);

      // Should be limited to max lengths
      expect(sanitized.gender.length).toBeLessThanOrEqual(100);
      expect(sanitized.race.length).toBeLessThanOrEqual(100);
      expect(sanitized.veteranStatus.length).toBeLessThanOrEqual(200);
      expect(sanitized.disabilityStatus.length).toBeLessThanOrEqual(200);
    });

    it('should handle null profile', () => {
      const sanitized = sanitizeUserProfile(null);
      expect(sanitized).toEqual({});
    });

    it('should handle undefined profile', () => {
      const sanitized = sanitizeUserProfile(undefined);
      expect(sanitized).toEqual({});
    });

    it('should return all fields even when profile is empty object', () => {
      const sanitized = sanitizeUserProfile({});

      // Should have all fields with empty strings
      expect(sanitized).toHaveProperty('name');
      expect(sanitized).toHaveProperty('email');
      expect(sanitized).toHaveProperty('phone');
      expect(sanitized).toHaveProperty('resume');
      expect(sanitized).toHaveProperty('workAuthorization');
      expect(sanitized).toHaveProperty('willingToRelocate');
      expect(sanitized).toHaveProperty('gender');
      expect(sanitized).toHaveProperty('race');
      expect(sanitized).toHaveProperty('veteranStatus');
      expect(sanitized).toHaveProperty('disabilityStatus');
    });

    it('should match real-world EEO dropdown values from UI', () => {
      // These are the exact values from App.tsx dropdowns
      const profile = {
        name: 'Test',
        email: 'test@test.com',
        phone: '555',
        resume: 'Resume',
        workAuthorization: 'Yes',
        willingToRelocate: 'Yes',
        gender: 'Male',  // Capitalized as in UI
        race: 'Hispanic or Latino',  // Full text as in UI
        veteranStatus: 'I am not a protected veteran',  // Full text
        disabilityStatus: 'Yes, I have a disability (or previously had a disability)'  // Full text
      };

      const sanitized = sanitizeUserProfile(profile);

      // Should preserve exact values
      expect(sanitized.gender).toBe('Male');
      expect(sanitized.race).toBe('Hispanic or Latino');
      expect(sanitized.veteranStatus).toBe('I am not a protected veteran');
      expect(sanitized.disabilityStatus).toBe('Yes, I have a disability (or previously had a disability)');
    });

    it('should not add extra fields beyond the expected ones', () => {
      const profile = {
        name: 'Test',
        email: 'test@test.com',
        phone: '555',
        resume: 'Resume',
        workAuthorization: 'Yes',
        willingToRelocate: 'Yes',
        gender: 'Male',
        race: 'White',
        veteranStatus: 'Not a veteran',
        disabilityStatus: 'No disability',
        // Extra field that should NOT be included
        extraField: 'This should not appear',
        password: 'secret123'
      };

      const sanitized = sanitizeUserProfile(profile);

      // Should not have extra fields
      expect(sanitized).not.toHaveProperty('extraField');
      expect(sanitized).not.toHaveProperty('password');

      // Should only have expected fields
      const expectedFields = [
        'name', 'email', 'phone', 'resume', 'workAuthorization',
        'willingToRelocate', 'gender', 'race', 'veteranStatus', 'disabilityStatus'
      ];
      expect(Object.keys(sanitized).sort()).toEqual(expectedFields.sort());
    });
  });
});
