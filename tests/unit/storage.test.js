/**
 * Unit Tests for Storage Module
 */

const fs = require('fs');
const path = require('path');

jest.mock('fs');

describe('Storage', () => {
  let storage;
  
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    
    jest.doMock('../../config/default', () => ({
      paths: {
        output: '/tmp/test-output'
      }
    }));
    
    jest.doMock('../logger/logger', () => ({
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    }));
    
    fs.existsSync.mockReturnValue(false);
    fs.mkdirSync.mockImplementation(() => {});
    
    storage = require('../../src/storage/storage');
  });

  describe('generateFilename', () => {
    it('should generate filename with prefix and extension', () => {
      const filename = storage.generateFilename('test', 'json');
      
      expect(filename).toContain('test-');
      expect(filename).toContain('.json');
    });
  });

  describe('saveJSON', () => {
    it('should save JSON data to file', async () => {
      fs.writeFileSync.mockImplementation(() => {});
      
      const filepath = await storage.saveJSON({ test: 'data' }, '/tmp/test.json');
      
      expect(fs.writeFileSync).toHaveBeenCalled();
      expect(filepath).toBe('/tmp/test.json');
    });

    it('should generate filename when not provided', async () => {
      fs.writeFileSync.mockImplementation(() => {});
      
      const filepath = await storage.saveJSON({ test: 'data' });
      
      expect(fs.writeFileSync).toHaveBeenCalled();
      expect(filepath).toContain('.json');
    });
  });

  describe('saveCSV', () => {
    it('should save CSV data to file', async () => {
      fs.writeFileSync.mockImplementation(() => {});
      
      const data = [{ name: 'John', age: 30 }];
      const filepath = await storage.saveCSV(data, '/tmp/test.csv');
      
      expect(fs.writeFileSync).toHaveBeenCalled();
    });

    it('should throw error when no columns defined', async () => {
      await expect(storage.saveCSV([], '/tmp/test.csv')).rejects.toThrow('No columns defined');
    });
  });

  describe('save', () => {
    it('should save as JSON by default', async () => {
      fs.writeFileSync.mockImplementation(() => {});
      
      const filepath = await storage.save({ test: 'data' });
      
      expect(fs.writeFileSync).toHaveBeenCalled();
    });

    it('should save as CSV when specified', async () => {
      fs.writeFileSync.mockImplementation(() => {});
      
      const data = [{ name: 'John' }];
      const filepath = await storage.save(data, 'csv');
      
      expect(fs.writeFileSync).toHaveBeenCalled();
    });
  });

  describe('loadJSON', () => {
    it('should load JSON data from file', async () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue('{"test": "data"}');
      
      const data = await storage.loadJSON('test.json');
      
      expect(data).toEqual({ test: 'data' });
    });
  });

  describe('listFiles', () => {
    it('should list all files in output directory', () => {
      fs.readdirSync.mockReturnValue(['file1.json', 'file2.csv', 'readme.txt']);
      
      const files = storage.listFiles();
      
      expect(files).toContain('file1.json');
      expect(files).toContain('file2.csv');
    });

    it('should filter by extension when specified', () => {
      fs.readdirSync.mockReturnValue(['file1.json', 'file2.csv', 'file3.json']);
      
      const files = storage.listFiles('json');
      
      expect(files).toEqual(['file1.json', 'file3.json']);
    });
  });

  describe('deleteFile', () => {
    it('should delete existing file', () => {
      fs.existsSync.mockReturnValue(true);
      fs.unlinkSync.mockImplementation(() => {});
      
      const result = storage.deleteFile('test.json');
      
      expect(result).toBe(true);
    });

    it('should return false when file does not exist', () => {
      fs.existsSync.mockReturnValue(false);
      
      const result = storage.deleteFile('nonexistent.json');
      
      expect(result).toBe(false);
    });
  });

  describe('getFileInfo', () => {
    it('should return null when file does not exist', () => {
      fs.existsSync.mockReturnValue(false);
      
      const info = storage.getFileInfo('nonexistent.json');
      
      expect(info).toBeNull();
    });

    it('should return file info when file exists', () => {
      fs.existsSync.mockReturnValue(true);
      fs.statSync.mockReturnValue({
        size: 1024,
        birthtime: new Date('2024-01-01'),
        mtime: new Date('2024-01-02')
      });
      
      const info = storage.getFileInfo('test.json');
      
      expect(info).not.toBeNull();
      expect(info.size).toBe(1024);
    });
  });
});
