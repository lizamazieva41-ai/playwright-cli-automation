/**
 * Unit Tests for Session Manager
 */

const path = require('path');
const fs = require('fs');

// Mock fs module
jest.mock('fs');

describe('SessionManager', () => {
  let sessionManager;
  
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    
    // Mock config
    jest.doMock('../../config/default', () => ({
      paths: {
        sessions: '/tmp/test-sessions'
      }
    }));
    
    // Mock logger
    jest.doMock('../logger/logger', () => ({
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    }));
    
    sessionManager = require('../../src/session/session-manager');
  });

  describe('listSessions', () => {
    it('should return empty array when sessions directory is empty', () => {
      fs.readdirSync.mockReturnValue([]);
      
      const sessions = sessionManager.listSessions();
      
      expect(sessions).toEqual([]);
    });

    it('should return session names from directory', () => {
      fs.readdirSync.mockReturnValue(['session1.json', 'session2.json', 'readme.txt']);
      
      const sessions = sessionManager.listSessions();
      
      expect(sessions).toEqual(['session1', 'session2']);
    });
  });

  describe('getSessionPath', () => {
    it('should return correct session path', () => {
      const result = sessionManager.getSessionPath('myprofile');
      
      expect(result).toContain('myprofile.json');
    });
  });

  describe('loadSession', () => {
    it('should return path when session exists', () => {
      fs.existsSync.mockReturnValue(true);
      
      const result = sessionManager.loadSession('existing');
      
      expect(result).toContain('existing.json');
    });

    it('should return null when session does not exist', () => {
      fs.existsSync.mockReturnValue(false);
      
      const result = sessionManager.loadSession('nonexistent');
      
      expect(result).toBeNull();
    });
  });

  describe('deleteSession', () => {
    it('should delete existing session', () => {
      fs.existsSync.mockReturnValue(true);
      fs.unlinkSync.mockImplementation(() => {});
      
      const result = sessionManager.deleteSession('deleteme');
      
      expect(result).toBe(true);
      expect(fs.unlinkSync).toHaveBeenCalled();
    });

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

    it('should return session info when session exists', () => {
      fs.existsSync.mockReturnValue(true);
      fs.statSync.mockReturnValue({
        birthtime: new Date('2024-01-01'),
        mtime: new Date('2024-01-02'),
        size: 1024
      });
      fs.readFileSync.mockReturnValue(JSON.stringify({
        cookies: [{ name: 'test' }],
        origins: []
      }));
      
      const result = sessionManager.getSessionInfo('testsession');
      
      expect(result).not.toBeNull();
      expect(result.cookieCount).toBe(1);
    });
  });
});
