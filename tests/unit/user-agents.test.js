/**
 * Unit Tests for User Agents Module
 */

describe('UserAgents', () => {
  let userAgents;
  
  beforeEach(() => {
    userAgents = require('../../src/stealth/user-agents');
  });

  describe('userAgents', () => {
    it('should have user agents array', () => {
      expect(Array.isArray(userAgents.userAgents)).toBe(true);
      expect(userAgents.userAgents.length).toBeGreaterThan(0);
    });

    it('should contain valid user agent strings', () => {
      userAgents.userAgents.forEach(ua => {
        expect(typeof ua).toBe('string');
        expect(ua).toContain('Mozilla/5.0');
      });
    });
  });

  describe('getRandomUserAgent', () => {
    it('should return a string', () => {
      const ua = userAgents.getRandomUserAgent();
      expect(typeof ua).toBe('string');
    });

    it('should return valid user agent format', () => {
      const ua = userAgents.getRandomUserAgent();
      expect(ua).toContain('Mozilla/5.0');
    });

    it('should return user agent from the list', () => {
      const ua = userAgents.getRandomUserAgent();
      expect(userAgents.userAgents).toContain(ua);
    });
  });

  describe('getUserAgentByPlatform', () => {
    it('should return Windows user agent', () => {
      const ua = userAgents.getUserAgentByPlatform('windows');
      expect(ua.toLowerCase()).toContain('windows');
    });

    it('should return macOS user agent', () => {
      const ua = userAgents.getUserAgentByPlatform('macos');
      expect(ua.toLowerCase()).toContain('mac os x');
    });

    it('should return Linux user agent', () => {
      const ua = userAgents.getUserAgentByPlatform('linux');
      const lower = ua.toLowerCase();
      expect(lower.includes('linux') || lower.includes('ubuntu')).toBe(true);
    });

    it('should return Android user agent', () => {
      const ua = userAgents.getUserAgentByPlatform('android');
      expect(ua.toLowerCase()).toContain('android');
    });

    it('should return iOS user agent', () => {
      const ua = userAgents.getUserAgentByPlatform('ios');
      const lower = ua.toLowerCase();
      expect(lower.includes('iphone') || lower.includes('ipad')).toBe(true);
    });

    it('should return random user agent for unknown platform', () => {
      const ua = userAgents.getUserAgentByPlatform('unknown');
      expect(typeof ua).toBe('string');
    });
  });

  describe('getUserAgentByBrowser', () => {
    it('should return Chrome user agent', () => {
      const ua = userAgents.getUserAgentByBrowser('chrome');
      const lower = ua.toLowerCase();
      expect(lower).toContain('chrome');
      expect(lower).not.toContain('edg');
    });

    it('should return Firefox user agent', () => {
      const ua = userAgents.getUserAgentByBrowser('firefox');
      expect(ua.toLowerCase()).toContain('firefox');
    });

    it('should return Safari user agent', () => {
      const ua = userAgents.getUserAgentByBrowser('safari');
      const lower = ua.toLowerCase();
      expect(lower).toContain('safari');
      expect(lower).not.toContain('chrome');
    });

    it('should return Edge user agent', () => {
      const ua = userAgents.getUserAgentByBrowser('edge');
      expect(ua.toLowerCase()).toContain('edg');
    });

    it('should return random user agent for unknown browser', () => {
      const ua = userAgents.getUserAgentByBrowser('unknown');
      expect(typeof ua).toBe('string');
    });
  });
});
