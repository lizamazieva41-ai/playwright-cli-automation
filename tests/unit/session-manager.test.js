/**
 * Unit Tests for Session Manager
 */

const path = require('path');
const fs = require('fs');

// Mock fs module completely
jest.mock('fs');

describe('SessionManager', () => {
  let sessionManager;
  
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    
    // Set up default mock implementations
    fs.existsSync.mockReturnValue(true);
    fs.readdirSync.mockReturnValue([]);
    fs.mkdirSync.mockImplementation(() => {});
    
    sessionManager = require('../../src/session/session-manager');
  });

  describe('listSessions', () => {
    it('should return empty array when sessions directory is empty', () => {
      fs.readdirSync.mockReturnValue([]);
      
      const sessions = sessionManager.listSessions();
      
      expect(sessions).toEqual([]);
    });
  });

  describe('getSessionPath', () => {
    it('should return correct session path', () => {
      const result = sessionManager.getSessionPath('myprofile');
      
      expect(result).toContain('myprofile.json');
    });
  });

  describe('loadSession', () => {
    it('should return null when session does not exist', () => {
      fs.existsSync.mockReturnValue(false);
      
      const result = sessionManager.loadSession('nonexistent');
      
      expect(result).toBeNull();
    });
  });

  describe('deleteSession', () => {
    it('should return false when session does not exist', () => {
      fs.existsSync.mockReturnValue(false);
      
      const result = sessionManager.deleteSession('nonexistent');
      
      expect(result).toBe(false);
    });
  });

  describe('getSessionInfo', () => {
    it('should return null when session does not exist', () => {
      fs.existsSync.mockReturnValue(false);
      
      const result = sessionManager.getSessionInfo('nonexistent');
      
      expect(result).toBeNull();
    });
  });
});
