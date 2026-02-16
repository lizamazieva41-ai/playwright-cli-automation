/**
 * Integration Tests for Browser Session
 */

const { firefox } = require('playwright');

describe('Browser Session Integration', () => {
  let browser;
  let context;
  let page;

  afterEach(async () => {
    if (context) await context.close();
    if (browser) await browser.close();
  });

  it('should launch browser and create context', async () => {
    browser = await firefox.launch({ headless: true });
    expect(browser).toBeDefined();
    
    context = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });
    expect(context).toBeDefined();
    
    page = await context.newPage();
    expect(page).toBeDefined();
  });

  it('should navigate to a page and get title', async () => {
    browser = await firefox.launch({ headless: true });
    context = await browser.newContext();
    page = await context.newPage();
    
    await page.goto('https://example.com', { waitUntil: 'domcontentloaded', timeout: 30000 });
    const title = await page.title();
    
    expect(title).toContain('Example');
  });

  it('should close context properly', async () => {
    browser = await firefox.launch({ headless: true });
    context = await browser.newContext();
    page = await context.newPage();
    
    await page.goto('https://example.com', { timeout: 30000 });
    await context.close();
    
    // Context should be closed
    expect(context.pages().length).toBe(0);
  });
});
