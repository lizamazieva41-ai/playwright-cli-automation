/**
 * Unit Tests for Stealth Module
 */

describe('Stealth', () => {
  let stealth;
  
  beforeEach(() => {
    stealth = require('../../src/stealth/stealth');
  });

  describe('applyStealthScripts', () => {
    it('should have applyStealthScripts function', () => {
      expect(typeof stealth.applyStealthScripts).toBe('function');
    });
  });

  describe('isDetectedAsBot', () => {
    it('should have isDetectedAsBot function', () => {
      expect(typeof stealth.isDetectedAsBot).toBe('function');
    });
  });

  describe('randomizeViewport', () => {
    it('should return object with width and height', () => {
      const viewport = stealth.randomizeViewport();
      
      expect(viewport).toHaveProperty('width');
      expect(viewport).toHaveProperty('height');
      expect(typeof viewport.width).toBe('number');
      expect(typeof viewport.height).toBe('number');
    });

    it('should randomize within variance range', () => {
      const base = { width: 1920, height: 1080 };
      const viewport = stealth.randomizeViewport(base);
      
      expect(viewport.width).toBeGreaterThanOrEqual(1870);
      expect(viewport.width).toBeLessThanOrEqual(1970);
      expect(viewport.height).toBeGreaterThanOrEqual(1050);
      expect(viewport.height).toBeLessThanOrEqual(1110);
    });

    it('should handle default viewport', () => {
      const viewport = stealth.randomizeViewport();
      
      expect(viewport.width).toBeGreaterThan(0);
      expect(viewport.height).toBeGreaterThan(0);
    });
  });
});
