/**
 * Integration Tests for CLI Commands
 */

const { exec } = require('child_process');
const path = require('path');

const CLI_PATH = path.join(__dirname, '../../src/index.js');

describe('CLI Commands Integration', () => {
  
  it('should show help when no args', (done) => {
    exec(`node ${CLI_PATH}`, (error, stdout, stderr) => {
      expect(error).toBeDefined();
      // Should show usage info
      const output = stdout + stderr;
      expect(output).toMatch(/Usage:|Commands:/);
      done();
    });
  });

  it('should show help for scrape command', (done) => {
    exec(`node ${CLI_PATH} scrape --help`, (error, stdout, stderr) => {
      const output = stdout + stderr;
      expect(output).toMatch(/scrape/i);
      expect(output).toMatch(/-c, --config/);
      done();
    });
  });

  it('should show help for session command', (done) => {
    exec(`node ${CLI_PATH} session --help`, (error, stdout, stderr) => {
      const output = stdout + stderr;
      expect(output).toMatch(/session/i);
      done();
    });
  });

  it('should show help for proxy command', (done) => {
    exec(`node ${CLI_PATH} proxy --help`, (error, stdout, stderr) => {
      const output = stdout + stderr;
      expect(output).toMatch(/proxy/i);
      done();
    });
  });

  it('should show help for test command', (done) => {
    exec(`node ${CLI_PATH} test --help`, (error, stdout, stderr) => {
      const output = stdout + stderr;
      expect(output).toMatch(/test/i);
      expect(output).toMatch(/-u, --url/);
      done();
    });
  });

  it('should show help for run command', (done) => {
    exec(`node ${CLI_PATH} run --help`, (error, stdout, stderr) => {
      const output = stdout + stderr;
      expect(output).toMatch(/run/i);
      expect(output).toMatch(/-t, --task/);
      done();
    });
  });
});
