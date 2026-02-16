/**
 * Unit Tests for Proxy Manager
 */

const fs = require('fs');

jest.mock('fs');

describe('ProxyManager', () => {
  let proxyManager;
  
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    
    jest.doMock('../../config/default', () => ({
      paths: {
        data: '/tmp/test-data'
      },
      proxy: {
        list: []
      }
    }));
    
    jest.doMock('../logger/logger', () => ({
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    }));
    
    fs.existsSync.mockReturnValue(false);
    fs.readFileSync.mockReturnValue('');
    
    proxyManager = require('../../src/proxy/proxy-manager');
  });

  describe('addProxy', () => {
    it('should add proxy to list', () => {
      proxyManager.addProxy('socks5://proxy.example.com:1080');
      
      expect(proxyManager.getProxyCount()).toBe(1);
    });

    it('should not add duplicate proxy', () => {
      proxyManager.addProxy('socks5://proxy.example.com:1080');
      proxyManager.addProxy('socks5://proxy.example.com:1080');
      
      expect(proxyManager.getProxyCount()).toBe(1);
    });
  });

  describe('removeProxy', () => {
    it('should remove existing proxy', () => {
      proxyManager.addProxy('socks5://proxy.example.com:1080');
      proxyManager.removeProxy('socks5://proxy.example.com:1080');
      
      expect(proxyManager.getProxyCount()).toBe(0);
    });
  });

  describe('getNextProxy', () => {
    it('should return null when no proxies', () => {
      const proxy = proxyManager.getNextProxy();
      
      expect(proxy).toBeNull();
    });

    it('should return proxy using round-robin', () => {
      proxyManager.addProxy('proxy1');
      proxyManager.addProxy('proxy2');
      
      const first = proxyManager.getNextProxy();
      const second = proxyManager.getNextProxy();
      
      expect(first).toBe('proxy1');
      expect(second).toBe('proxy2');
    });

    it('should wrap around after all proxies', () => {
      proxyManager.addProxy('proxy1');
      proxyManager.addProxy('proxy2');
      
      proxyManager.getNextProxy();
      proxyManager.getNextProxy();
      const third = proxyManager.getNextProxy();
      
      expect(third).toBe('proxy1');
    });
  });

  describe('getRandomProxy', () => {
    it('should return null when no proxies', () => {
      const proxy = proxyManager.getRandomProxy();
      
      expect(proxy).toBeNull();
    });

    it('should return a proxy from the list', () => {
      proxyManager.addProxy('proxy1');
      proxyManager.addProxy('proxy2');
      proxyManager.addProxy('proxy3');
      
      const proxy = proxyManager.getRandomProxy();
      
      expect(['proxy1', 'proxy2', 'proxy3']).toContain(proxy);
    });
  });

  describe('getAllProxies', () => {
    it('should return copy of proxies array', () => {
      proxyManager.addProxy('proxy1');
      proxyManager.addProxy('proxy2');
      
      const proxies = proxyManager.getAllProxies();
      
      expect(proxies).toEqual(['proxy1', 'proxy2']);
      proxies.push('proxy3');
      expect(proxyManager.getProxyCount()).toBe(2);
    });
  });

  describe('parseProxy', () => {
    it('should parse socks5 proxy', () => {
      const result = proxyManager.parseProxy('socks5://user:pass@proxy.example.com:1080');
      
      expect(result.protocol).toBe('socks5');
      expect(result.username).toBe('user');
      expect(result.password).toBe('pass');
      expect(result.host).toBe('proxy.example.com');
      expect(result.port).toBe(1080);
    });

    it('should parse http proxy', () => {
      const result = proxyManager.parseProxy('http://proxy.example.com:8080');
      
      expect(result.protocol).toBe('http');
      expect(result.host).toBe('proxy.example.com');
      expect(result.port).toBe(8080);
    });

    it('should return null for invalid proxy', () => {
      const result = proxyManager.parseProxy('invalid');
      
      expect(result).toBeNull();
    });
  });

  describe('resetIndex', () => {
    it('should reset round-robin index', () => {
      proxyManager.addProxy('proxy1');
      proxyManager.addProxy('proxy2');
      
      proxyManager.getNextProxy();
      proxyManager.getNextProxy();
      proxyManager.resetIndex();
      
      expect(proxyManager.getNextProxy()).toBe('proxy1');
    });
  });
});
