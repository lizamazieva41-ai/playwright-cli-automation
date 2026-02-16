/**
 * Storage Module
 * Handles saving scraped data to JSON, CSV, or database
 */

const fs = require('fs');
const path = require('path');
const config = require('../../config/default');
const logger = require('../logger/logger');

class Storage {
  constructor() {
    this.outputDir = config.paths.output;
    this.ensureOutputDir();
  }

  /**
   * Ensure output directory exists
   */
  ensureOutputDir() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
      logger.debug(`Created output directory: ${this.outputDir}`);
    }
  }

  /**
   * Generate output filename
   * @param {string} prefix - Filename prefix
   * @param {string} extension - File extension
   * @returns {string} Full file path
   */
  generateFilename(prefix, extension) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return path.join(this.outputDir, `${prefix}-${timestamp}.${extension}`);
  }

  /**
   * Save data to JSON file
   * @param {Object|Array} data - Data to save
   * @param {string} filename - Output filename (optional)
   * @returns {Promise<string>} Path to saved file
   */
  async saveJSON(data, filename) {
    const filepath = filename || this.generateFilename('output', 'json');
    
    try {
      const jsonContent = JSON.stringify(data, null, 2);
      fs.writeFileSync(filepath, jsonContent, 'utf8');
      logger.info(`JSON saved: ${filepath}`);
      return filepath;
    } catch (error) {
      logger.error('Failed to save JSON:', error);
      throw error;
    }
  }

  /**
   * Save data to CSV file
   * @param {Array} data - Array of objects to save
   * @param {string} filename - Output filename (optional)
   * @param {Array} columns - Column headers (optional, inferred from first row)
   * @returns {Promise<string>} Path to saved file
   */
  async saveCSV(data, filename, columns) {
    const filepath = filename || this.generateFilename('output', 'csv');
    
    try {
      // Infer columns from first object if not provided
      if (!columns && data.length > 0) {
        columns = Object.keys(data[0]);
      }

      if (!columns || columns.length === 0) {
        throw new Error('No columns defined for CSV');
      }

      // Build CSV header
      const header = columns.join(',');
      
      // Build CSV rows
      const rows = data.map(item => 
        columns.map(col => {
          const value = item[col];
          // Escape quotes and wrap in quotes if contains comma
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value !== undefined ? value : '';
        }).join(',')
      );

      const csvContent = [header, ...rows].join('\n');
      fs.writeFileSync(filepath, csvContent, 'utf8');
      logger.info(`CSV saved: ${filepath}`);
      return filepath;
    } catch (error) {
      logger.error('Failed to save CSV:', error);
      throw error;
    }
  }

  /**
   * Append data to existing JSON file
   * @param {Object|Array} data - Data to append
   * @param {string} filename - Target filename
   * @returns {Promise<string>} Path to file
   */
  async appendJSON(data, filename) {
    const filepath = path.join(this.outputDir, filename);
    
    try {
      let existingData = [];
      
      // Read existing file if it exists
      if (fs.existsSync(filepath)) {
        const content = fs.readFileSync(filepath, 'utf8');
        existingData = JSON.parse(content);
        
        // Ensure array
        if (!Array.isArray(existingData)) {
          existingData = [existingData];
        }
      }

      // Append new data
      if (Array.isArray(data)) {
        existingData = [...existingData, ...data];
      } else {
        existingData.push(data);
      }

      // Save combined data
      return this.saveJSON(existingData, filepath);
    } catch (error) {
      logger.error('Failed to append JSON:', error);
      throw error;
    }
  }

  /**
   * Save data to file in specified format
   * @param {Object|Array} data - Data to save
   * @param {string} format - Format: 'json' or 'csv'
   * @param {string} filename - Output filename (optional)
   * @returns {Promise<string>} Path to saved file
   */
  async save(data, format = 'json', filename) {
    if (format.toLowerCase() === 'csv') {
      return this.saveCSV(data, filename);
    }
    return this.saveJSON(data, filename);
  }

  /**
   * Load data from JSON file
   * @param {string} filename - File to load
   * @returns {Promise<Object|Array>} Loaded data
   */
  async loadJSON(filename) {
    const filepath = path.isAbsolute(filename) ? filename : path.join(this.outputDir, filename);
    
    try {
      const content = fs.readFileSync(filepath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      logger.error('Failed to load JSON:', error);
      throw error;
    }
  }

  /**
   * List all output files
   * @param {string} extension - Filter by extension
   * @returns {Array} List of filenames
   */
  listFiles(extension) {
    try {
      const files = fs.readdirSync(this.outputDir);
      
      if (extension) {
        return files.filter(f => f.endsWith(`.${extension}`));
      }
      
      return files;
    } catch (error) {
      logger.error('Failed to list files:', error);
      return [];
    }
  }

  /**
   * Delete output file
   * @param {string} filename - File to delete
   * @returns {boolean} True if deleted
   */
  deleteFile(filename) {
    const filepath = path.isAbsolute(filename) ? filename : path.join(this.outputDir, filename);
    
    try {
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
        logger.info(`Deleted: ${filepath}`);
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Failed to delete file:', error);
      return false;
    }
  }

  /**
   * Get file info
   * @param {string} filename - File to check
   * @returns {Object|null} File info
   */
  getFileInfo(filename) {
    const filepath = path.isAbsolute(filename) ? filename : path.join(this.outputDir, filename);
    
    try {
      if (!fs.existsSync(filepath)) {
        return null;
      }
      
      const stats = fs.statSync(filepath);
      return {
        name: path.basename(filepath),
        path: filepath,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
      };
    } catch (error) {
      logger.error('Failed to get file info:', error);
      return null;
    }
  }
}

// Export singleton instance
module.exports = new Storage();
