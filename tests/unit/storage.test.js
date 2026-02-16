/**
 * Unit Tests for Storage Module
 */

const fs = require('fs');

jest.mock('fs');

describe('Storage', () => {
  let storage;
  
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    
    // Mock fs completely
    fs.existsSync.mockReturnValue(true);
    fs.mkdirSync.mockImplementation(() => {});
    fs.writeFileSync.mockImplementation(() => {});
    
    // Mock config and logger before requiring storage
    jest.mock('../../config/default', () => ({
      paths: { output: '/tmp/test-output' }
    }), { virtual: true });
    
    jest.mock('../../src/logger/logger', () => ({
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    }), { virtual: true });
    
    storage = require('../../src/storage/storage');
  });

  describe('generateFilename', () => {
    it('should generate filename with prefix and extension', () => {
      const filename = storage.generateFilename('test', 'json');
      
      expect(filename).toContain('test-');
      expect(filename).toContain('.json');
    });
  });
});
