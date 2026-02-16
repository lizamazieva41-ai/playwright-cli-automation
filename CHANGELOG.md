# Changelog

All notable changes to this project will be documented in this file.

## [1.0.1] - 2026-02-16

### Fixed
- CLI output noisy - moved proxy-manager and notifier logs from info/warn to debug level
- Security vulnerability - updated nodemailer to v8.0.1

### Added
- ESLint configuration with `.eslintrc.json`
- Lint scripts: `npm run lint` and `npm run lint:fix`
- Husky pre-commit hooks with lint-staged
- GitHub Actions CI/CD workflow (`.github/workflows/ci.yml`)
- Package metadata: author, repository, homepage, bugs, files fields

### Changed
- Updated `prepublishOnly` script to run tests before publishing
- Package files field to specify included files in npm package

## [1.0.0] - 2026-02-16

### Added
- **Browser Automation**: Firefox browser control with Playwright
- **Stealth Mode**: Anti-bot detection with:
  - Randomized User-Agent strings
  - WebGL fingerprint protection
  - Canvas fingerprint randomization
  - Human behavior simulation (mouse movement, typing, scrolling)
- **Session Management**: Save and load browser sessions (cookies, localStorage)
- **Proxy Support**: SOCKS5 proxy with round-robin rotation
- **Parallel Execution**: Concurrent task execution with configurable limit
- **Logging**: Winston-based logging with file output
- **Notifications**: Email (SMTP) and Slack webhook notifications
- **Storage**: Save results to JSON or CSV format

### Commands
- `login`: Save login session
- `scrape`: Scrape data from websites
- `test`: Run web tests/checks
- `run`: Execute comprehensive tasks
- `session`: Manage sessions (list, info, delete, validate)
- `proxy`: Manage proxies (list, test, add, remove)

### Files Added
- `.gitignore`: Git ignore patterns
- `src/core/page-actions.js`: Reusable page actions with retry and stealth
- `examples/`: Sample configuration files
- `tests/`: Unit and integration tests
- `jest.config.js`: Jest test configuration
- `CHANGELOG.md`: Version history

### Fixed
- TaskRunner singleton bug (was creating new instance instead of using singleton)
- Browser headless default value (now defaults to headless mode)
- p-limit version locked to 3.1.0 (avoid ESM compatibility issues)

### Changed
- Graceful shutdown handling (SIGINT/SIGTERM)
- Progress tracking for parallel tasks

## [0.0.1] - Initial Development

### Initial Release
- Basic browser automation with Playwright
- Core modules: browser-manager, task-runner
- Feature modules: session, stealth, user-agents, human-behavior, proxy, scraper
- Infrastructure: logger, notifier, storage
- Configuration system with environment variables

---

## Migration Notes

### Upgrading to v1.0.0
- Session commands now use `autobot session` subcommand
- Proxy commands now use `autobot proxy` subcommand
- Browser defaults to headless mode (use `--headful` for visible mode)
