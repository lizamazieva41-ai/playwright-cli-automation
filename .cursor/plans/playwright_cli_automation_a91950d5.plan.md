---
name: Playwright CLI Automation
overview: "Xay dung ung dung CLI Node.js su dung Playwright de tu dong hoa trinh duyet Firefox voi cac tinh nang: dang nhap/luu phien, thu thap du lieu, chong phat hien bot (stealth), proxy SOCKS, chay song song nhieu trinh duyet, ghi log va gui thong bao."
todos:
  - id: phase-1-init
    content: "Phase 1: Khoi tao du an - package.json, cau truc thu muc, cau hinh (.env, config/default.js)"
    status: pending
  - id: phase-2-browser
    content: "Phase 2: Module Core - BrowserManager (launch Firefox, tao Context voi proxy/session/UA/viewport)"
    status: pending
  - id: phase-3-session
    content: "Phase 3: Module Session - Luu/tai storageState (cookies, localStorage) cho dang nhap"
    status: pending
  - id: phase-4-stealth
    content: "Phase 4: Module Stealth - Chong bot (navigator.webdriver, UA ngau nhien, human behavior simulation)"
    status: pending
  - id: phase-5-proxy
    content: "Phase 5: Module Proxy - Quan ly danh sach proxy SOCKS, round-robin, kiem tra proxy"
    status: pending
  - id: phase-6-scraper
    content: "Phase 6: Module Scraper - Thu thap du lieu tu trang web theo cau hinh JSON"
    status: pending
  - id: phase-7-parallel
    content: "Phase 7: Module TaskRunner - Chay song song nhieu task voi gioi han concurrency"
    status: pending
  - id: phase-8-logger
    content: "Phase 8: Module Logger - Cau hinh Winston (console + file, phan tach error log)"
    status: pending
  - id: phase-9-notifier
    content: "Phase 9: Module Notifier - Gui thong bao qua Email (NodeMailer) va Slack (Webhook)"
    status: pending
  - id: phase-10-storage
    content: "Phase 10: Module Storage - Luu ket qua ra JSON/CSV (mo rong DB)"
    status: pending
  - id: phase-11-cli
    content: "Phase 11: CLI Commands - Dinh nghia lenh login, scrape, test, run voi Commander"
    status: pending
  - id: phase-12-test
    content: "Phase 12: Testing va hoan thien - Unit/Integration tests, README, PM2 config"
    status: pending
isProject: false
---

# Ke hoach trien khai du an CLI Tu dong hoa Trinh duyet voi Playwright

## Tong quan

Ung dung CLI viet bang Node.js chay tren Linux, su dung Playwright dieu khien Firefox headless. Ho tro dang nhap va luu phien, thu thap du lieu, kiem thu web, chong phat hien bot, proxy SOCKS cho tung tab, chay song song nhieu trinh duyet, ghi log va gui thong bao.

## Cau truc thu muc du an

```
automatic/
  package.json
  .env.example
  config/
    default.js            # Cau hinh mac dinh (proxy, viewport, timeout, ...)
  src/
    index.js              # Entry point - khoi tao CLI
    cli/
      commands/
        login.js          # Lenh `login` - dang nhap va luu session
        scrape.js         # Lenh `scrape` - thu thap du lieu
        test.js           # Lenh `test` - kiem thu web
        run.js            # Lenh `run` - chay task tu file config
    core/
      browser-manager.js  # Khoi tao va quan ly Playwright Browser/Context
      task-runner.js      # Dieu phoi chay nhieu task song song
      page-actions.js     # Cac thao tac co ban tren page (goto, click, fill, ...)
    session/
      session-manager.js  # Luu/tai storageState (cookies, localStorage)
    stealth/
      stealth.js          # Tong hop cac ky thuat chong bot
      user-agents.js      # Danh sach User-Agent ngau nhien
      human-behavior.js   # Mo phong hanh vi nguoi dung (delay, mouse move, typing)
    proxy/
      proxy-manager.js    # Quan ly danh sach proxy, xoay vong proxy
    scraper/
      scraper.js          # Logic thu thap du lieu tu trang web
    logger/
      logger.js           # Cau hinh Winston logger
    notifier/
      notifier.js         # Gui thong bao qua email/Slack
      email.js            # NodeMailer integration
      slack.js            # Slack Webhook integration
    storage/
      storage.js          # Luu ket qua ra file JSON/CSV hoac database
  data/
    sessions/             # Luu tru file session.json
    output/               # Ket qua thu thap
    logs/                 # File log
  tests/
    unit/                 # Unit tests
    integration/          # Integration tests
```

## Phase 1: Khoi tao du an va cau hinh co ban

- Khoi tao `package.json` voi cac dependencies chinh:
  - `playwright` - dieu khien trinh duyet
  - `commander` - CLI framework
  - `winston` - logging
  - `dotenv` - quan ly bien moi truong
  - `nodemailer` - gui email
- Tao file `.env.example` voi cac bien moi truong mau (SMTP, Slack webhook, proxy list, ...)
- Tao `config/default.js` chua cau hinh mac dinh: viewport (1920x1080), timeout, duong dan luu session/output/log

## Phase 2: Module Core - Browser Manager

File: `src/core/browser-manager.js`

- Ham `launchBrowser(options)`: Khoi tao Playwright Firefox (headless mac dinh, ho tro headful qua flag)
- Ham `createContext(options)`: Tao BrowserContext moi voi:
  - Proxy SOCKS: `{ proxy: { server: 'socks5://host:port' } }`
  - storageState tu file session neu co
  - User-Agent ngau nhien tu danh sach
  - Viewport tuy chinh
- Ham `createPage(context)`: Tao page moi, inject stealth scripts truoc khi dung
- Ham `closeAll()`: Dong tat ca context va browser

```javascript
// Vi du tao context voi proxy va session
const context = await browser.newContext({
  proxy: { server: 'socks5://proxy:1080' },
  storageState: 'data/sessions/session.json',
  userAgent: getRandomUserAgent(),
  viewport: { width: 1920, height: 1080 }
});
```

## Phase 3: Module Session - Dang nhap va Luu phien

File: `src/session/session-manager.js`

- Ham `saveSession(context, profileName)`: Goi `context.storageState({ path })` luu cookie/localStorage ra file `data/sessions/{profileName}.json`
- Ham `loadSession(profileName)`: Tra ve duong dan file session de truyen vao `browser.newContext({ storageState })`
- Ham `isSessionValid(profileName)`: Kiem tra file session con hop le (tuy chon: kiem tra cookie expiry)

## Phase 4: Module Stealth - Chong phat hien bot

File: `src/stealth/stealth.js`

- Ham `applyStealthScripts(page)`: Inject JavaScript vao page truoc khi load:
  - Ghi de `navigator.webdriver = false`
  - Override `navigator.plugins`, `navigator.languages`
  - Fake WebGL renderer, canvas fingerprint

File: `src/stealth/user-agents.js`

- Danh sach 50+ User-Agent pho bien (Chrome, Firefox tren Windows/Mac/Linux)
- Ham `getRandomUserAgent()`: Tra ve UA ngau nhien

File: `src/stealth/human-behavior.js`

- Ham `humanDelay(min, max)`: Sleep ngau nhien giua min-max ms
- Ham `humanType(page, selector, text)`: Go tung ky tu voi delay ngau nhien 50-150ms
- Ham `humanClick(page, selector)`: Di chuot den phan tu bang `mouse.move()` voi steps ngau nhien, sau do click
- Ham `humanScroll(page)`: Cuon trang ngau nhien, mo phong doc noi dung

## Phase 5: Module Proxy - Quan ly Proxy

File: `src/proxy/proxy-manager.js`

- Ham `loadProxies(source)`: Doc danh sach proxy tu file hoac bien moi truong
- Ham `getNextProxy()`: Tra ve proxy tiep theo theo co che round-robin
- Ham `testProxy(proxy)`: Kiem tra proxy con hoat dong
- Ho tro dinh dang: `socks5://user:pass@host:port`

## Phase 6: Module Scraper - Thu thap du lieu

File: `src/scraper/scraper.js`

- Ham `scrape(page, config)`: Nhan vao page va cau hinh (selectors, actions) de thu thap du lieu
- Ho tro cau hinh kieu JSON dinh nghia cac buoc: goto URL -> doi selector -> lay noi dung -> chuyen trang
- Ham `extractData(page, selectors)`: Truy van DOM va tra ve du lieu co cau truc
- Ho tro chup screenshot khi loi: `page.screenshot({ path })`

## Phase 7: Module Song song hoa - Task Runner

File: `src/core/task-runner.js`

- Ham `runParallel(tasks, concurrency)`: Chay nhieu task dong thoi voi gioi han concurrency
- Moi task = 1 BrowserContext rieng voi proxy rieng
- Su dung `Promise.all` ket hop semaphore/queue de gioi han so luong dong thoi
- Xu ly loi tung task doc lap, khong anh huong task khac

```javascript
// Vi du chay 5 task song song, moi task co proxy rieng
const tasks = proxies.map((proxy, i) => async () => {
  const context = await createContext({ proxy });
  const page = await context.newPage();
  await scrape(page, config);
  await context.close();
});
await runParallel(tasks, 5);
```

## Phase 8: Module Logger

File: `src/logger/logger.js`

- Cau hinh Winston voi:
  - Transport console (format mau, co timestamp)
  - Transport file: `data/logs/app-YYYY-MM-DD.log`
  - Transport file error rieng: `data/logs/error-YYYY-MM-DD.log`
  - Cac muc: error, warn, info, debug
- Export instance logger de dung chung toan ung dung

## Phase 9: Module Notifier - Thong bao

File: `src/notifier/email.js`

- Su dung NodeMailer gui email tong hop ket qua hoac canh bao loi
- Doc cau hinh SMTP tu `.env`

File: `src/notifier/slack.js`

- Gui message qua Slack Incoming Webhook
- Format message voi thong tin: so task thanh cong/that bai, thoi gian chay, link ket qua

File: `src/notifier/notifier.js`

- Ham `notify(type, message)`: Gui thong bao theo kenh da cau hinh (email, slack, hoac ca hai)

## Phase 10: Module Storage - Luu ket qua

File: `src/storage/storage.js`

- Ham `saveJSON(data, filename)`: Luu ket qua ra file JSON trong `data/output/`
- Ham `saveCSV(data, filename)`: Luu ket qua ra file CSV
- (Mo rong) Ho tro luu vao MongoDB/PostgreSQL qua adapter pattern

## Phase 11: CLI Commands - Dinh nghia lenh

File: `src/index.js` - Entry point

```javascript
const { program } = require('commander');
program
  .name('autobot')
  .description('CLI tu dong hoa trinh duyet voi Playwright')
  .version('1.0.0');
// Dang ky cac sub-commands
program.addCommand(require('./cli/commands/login'));
program.addCommand(require('./cli/commands/scrape'));
program.addCommand(require('./cli/commands/test'));
program.addCommand(require('./cli/commands/run'));
program.parse();
```

**Lenh `login**`: `autobot login --url <url> --session <name> [--proxy <proxy>] [--headful]`

- Mo trinh duyet (headful de nguoi dung thao tac), dang nhap thu cong
- Luu session khi nguoi dung xac nhan xong

**Lenh `scrape**`: `autobot scrape --config <file> [--proxy <proxy>] [--parallel <n>] [--output <format>]`

- Doc cau hinh scraping tu file JSON
- Ho tro chay song song nhieu URL voi proxy xoay vong

**Lenh `test**`: `autobot test --url <url> --checks <file> [--screenshot]`

- Chay kiem thu web theo danh sach checks

**Lenh `run**`: `autobot run --task <file> [--parallel <n>]`

- Chay task tong hop tu file cau hinh (bao gom login, scrape, test)

## Phase 12: Testing va Hoan thien

- Viet unit tests cho cac module (session, stealth, proxy, storage)
- Viet integration test: login -> save session -> scrape voi session da luu
- Tao README.md huong dan cai dat va su dung
- Cau hinh PM2 ecosystem file de chay dich vu

## So do kien truc

```mermaid
flowchart TB
    CLI[CLI_Entry_Point] --> LoginCmd[Login_Command]
    CLI --> ScrapeCmd[Scrape_Command]
    CLI --> TestCmd[Test_Command]
    CLI --> RunCmd[Run_Command]

    subgraph core [Core Layer]
        BM[BrowserManager]
        TR[TaskRunner]
        PA[PageActions]
    end

    subgraph modules [Feature Modules]
        SM[SessionManager]
        ST[StealthModule]
        PM[ProxyManager]
        SC[ScraperModule]
    end

    subgraph infra [Infrastructure]
        LG[Logger_Winston]
        NF[Notifier_Email_Slack]
        SR[Storage_JSON_CSV]
    end

    LoginCmd --> BM
    ScrapeCmd --> TR
    TestCmd --> BM
    RunCmd --> TR

    TR --> BM
    BM --> SM
    BM --> ST
    BM --> PM
    TR --> SC
    SC --> PA

    LoginCmd --> LG
    ScrapeCmd --> LG
    ScrapeCmd --> NF
    ScrapeCmd --> SR
    TestCmd --> LG
    TestCmd --> NF
```



## Danh sach Dependencies chinh

- `playwright` - Dieu khien trinh duyet
- `commander` - CLI framework
- `winston` - Logging
- `dotenv` - Bien moi truong
- `nodemailer` - Gui email
- `csv-writer` - Xuat CSV
- `p-limit` - Gioi han concurrency cho Promise

