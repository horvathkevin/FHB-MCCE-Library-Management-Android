# Mobile Test Automation with WebdriverIO & Appium
## FHB 2026 — Lesson Script (~60 minutes)

---

## Learning Goals
By the end of this lesson students will be able to:
1. Explain what Appium is and how WebdriverIO uses it
2. Upload an APK to Sauce Labs and inspect UI elements with the built-in Appium Inspector
3. Identify stable locators (`testID` / accessibility id) using the Inspector
4. Write WebdriverIO test cases using accessibility-id-based locators
5. Use the re-seed button to reset app state between test runs
6. Run a small test suite against a real cloud device on Sauce Labs

---

## Prerequisites (done before the lesson)
- Node.js 18+ and npm installed
- A Sauce Labs account — free trial at https://saucelabs.com
  - **`SAUCE_USERNAME`** and **`SAUCE_ACCESS_KEY`** set as environment variables
- The FHB Library APK downloaded from GitHub Actions:
  - **[Download the APK here](https://github.com/horvathkevin/FHB-MCCE-Library-Management-Android/actions/runs/27850644020/artifacts/7759278626)**
  - Unzip to get `app-debug.apk`

---

## Block 0 — Introduction (5 min)

### What is Appium?
Appium is an open-source automation framework for mobile apps. It exposes a WebDriver-compatible API that lets you control Android and iOS apps programmatically — tapping buttons, filling inputs, reading text.

### What is WebdriverIO?
WebdriverIO (WDIO) is a popular test automation framework for web and mobile. For mobile testing, it acts as a WebDriver client that talks to Appium. It provides a clean async API, built-in assertions, and excellent Sauce Labs integration via the `@wdio/sauce-service`.

```
Your test code (WebdriverIO)
     ↓
WDIO test runner + Appium protocol
     ↓
Sauce Labs Cloud (Appium server)
     ↓
Real Android device in a data centre
```

### What is Sauce Labs?
Sauce Labs is a cloud platform that provides real physical Android and iOS devices you can run Appium tests against — no local emulator or USB cable needed. You upload your APK once, and Sauce Labs installs it on the device for each test session. It also includes a built-in **Appium Inspector** for live element exploration.

### The app we are testing
The **FHB Library App** is a library management system. It manages books, members, loans, and reservations — all stored locally in SQLite on the device. There is no backend.

---

## Block 1 — Setup & APK Upload (10 min)

### Step 1: Set your Sauce Labs credentials
Store these as environment variables — never hard-code them in test files.

**macOS / Linux:**
```bash
export SAUCE_USERNAME=your-username
export SAUCE_ACCESS_KEY=your-access-key
```

**Windows (PowerShell):**
```powershell
$env:SAUCE_USERNAME = "your-username"
$env:SAUCE_ACCESS_KEY = "your-access-key"
```

Find your access key at: https://app.saucelabs.com/user-settings

### Step 2: Upload the APK to Sauce Labs App Storage
Sauce Labs needs the APK in its storage before tests can run. You have two options:

**Option A — Upload via the Sauce Labs UI:**
1. Go to https://app.saucelabs.com → **App Management** (left sidebar)
2. Click **Upload App**
3. Select your `app-debug.apk` file
4. Once uploaded, note the filename (e.g. `FHBLibrary.apk`)

**Option B — Upload via cURL:**
```bash
curl -u "$SAUCE_USERNAME:$SAUCE_ACCESS_KEY" \
  -X POST "https://api.eu-central-1.saucelabs.com/v1/storage/upload" \
  -H "Content-Type: multipart/form-data" \
  -F "payload=@app-debug.apk" \
  -F "name=FHBLibrary.apk"
```

> **Note:** Use `api.us-west-1.saucelabs.com` if your account is on the US data centre.

The response contains a storage ID — the filename you will reference in test capabilities:
```json
{ "item": { "id": "abc123...", "storage_id": "abc123..." } }
```

---

## Block 2 — Exploring the App with Appium Inspector (15 min)

Before writing any automated tests, we need to understand the app's UI structure. Sauce Labs has a **built-in Appium Inspector** — no separate download needed.

### Starting a Live Session with Inspector

1. Go to https://app.saucelabs.com → **Live** → **Mobile App**
2. Select your uploaded APK (`FHBLibrary.apk`)
3. Pick a device (e.g. **Google Pixel 7**, Android 13)
4. Click **Launch** — Sauce Labs installs the APK and starts a live session
5. Once the app is running, click the **Developer Tools** icon (wrench icon) in the toolbar
6. Select **Appium Inspector** — this opens the element inspector overlay

### What to look for in the Inspector

The Inspector shows two panels:
- **Left:** a live screenshot of the device — click any element to select it
- **Right:** the element's attributes — `content-desc`, `resource-id`, `text`, `class`, etc.

For this app, the key attribute is **`content-desc`** — this is where React Native's `testID` prop appears on Android.

### Exercise 2A — Explore the Books screen (~5 min)

1. The app launches on the Books tab. Click on the first book row in the Inspector.
2. Find the `content-desc` attribute — it should read `book-item-1`
3. Click the book title text — its `content-desc` should read `book-title-1`
4. Click the "+" Add Book button — its `content-desc` should read `add-book-button`

### Exercise 2B — Explore navigation and other tabs (~5 min)

1. In the live session, tap the **Members** tab at the bottom
2. Use the Inspector to find the `content-desc` of a member row → `member-item-1`
3. Tap the **Loans** tab — find the filter buttons (`loans-filter-active`, `loans-filter-overdue`, etc.)
4. Tap the **More** tab — find the re-seed button (`seed-database-button`)

### Exercise 2C — Tap the re-seed button live (~3 min)

1. In the live session (not the Inspector), tap **More** → **Reset / Re-seed Database**
2. Confirm with **RESET & RESEED**
3. Navigate back to Books — the data is back to its original state

### Complete testID reference for this app

| Element | testID / content-desc |
|---|---|
| Books list (FlatList) | `books-list` |
| Book row | `book-item-{id}` |
| Book title text | `book-title-{id}` |
| Book availability badge | `book-availability-{id}` |
| Copy count text | `book-copies-{id}` |
| Add Book button | `add-book-button` |
| Borrow button (detail) | `borrow-button-{bookId}` |
| Reserve button (detail) | `reserve-button-{bookId}` |
| Members list | `members-list` |
| Member row | `member-item-{id}` |
| Member status badge | `member-status-badge-{id}` |
| Add Member button | `add-member-button` |
| Loans list | `loans-list` |
| Loan row | `loan-item-{id}` |
| Loan status badge | `loan-status-badge-{id}` |
| Loan fee text | `loan-fee-{id}` |
| Return button (detail) | `return-button-{loanId}` |
| Reservations list | `reservations-list` |
| Reservation row | `reservation-item-{id}` |
| Cancel reservation button | `cancel-reservation-button-{id}` |
| Global search input | `search-input` |
| Re-seed button | `seed-database-button` |
| Reports screen | `reports-screen` |
| Stat cards | `stat-total-books`, `stat-active-loans`, etc. |
| Bottom tab — Books | accessibility label `tab-books` |
| Bottom tab — Members | accessibility label `tab-members` |
| Bottom tab — Loans | accessibility label `tab-loans` |
| Bottom tab — Reservations | accessibility label `tab-reservations` |
| Bottom tab — More | accessibility label `tab-more` |

---

## Block 3 — Setting Up WebdriverIO (10 min)

Now that we know the locators, let's automate.

### Step 1: Create a test project

```bash
mkdir library-tests && cd library-tests
npm init -y
npm install --save-dev @wdio/cli @wdio/local-runner @wdio/mocha-framework @wdio/spec-reporter @wdio/sauce-service
```

### Step 2: Create the WDIO config (`wdio.conf.ts`)

```typescript
// wdio.conf.ts
export const config: WebdriverIO.Config = {
  runner: 'local',
  specs: ['./tests/**/*.test.ts'],
  maxInstances: 1,

  user: process.env.SAUCE_USERNAME,
  key: process.env.SAUCE_ACCESS_KEY,
  region: 'eu',  // change to 'us' if on US data centre

  capabilities: [{
    platformName: 'Android',
    'appium:automationName': 'UiAutomator2',
    'appium:deviceName': 'Google Pixel 7',
    'appium:platformVersion': '13',
    'appium:app': 'storage:filename=FHBLibrary.apk',
    'appium:appPackage': 'com.fhb.libraryandroid',
    'appium:appActivity': '.MainActivity',
    'appium:noReset': false,
    'appium:newCommandTimeout': 120,
    'sauce:options': {
      appiumVersion: '2.0.0',
      build: 'FHB Library Lesson',
      name: 'Library Tests',
    },
  }],

  framework: 'mocha',
  mochaOpts: {
    ui: 'bdd',
    timeout: 120_000,
  },
  reporters: ['spec'],
  services: ['sauce'],

  waitforTimeout: 15_000,
};
```

### Step 3: Write a smoke test (`tests/smoke.test.ts`)

```typescript
describe('Library App - Smoke', () => {
  it('app launches and shows the Books list', async () => {
    const booksList = await $('~books-list');
    await booksList.waitForDisplayed({ timeout: 30_000 });
    await expect(booksList).toBeDisplayed();
  });
});
```

> **Note:** In WebdriverIO, `$('~books-list')` is shorthand for finding an element by accessibility id. The `~` prefix tells WDIO to use the accessibility id locator strategy.

### Step 4: Run it

```bash
npx wdio run wdio.conf.ts
```

**Expected result:** Sauce Labs allocates a real Pixel 7, installs the APK, and the test passes. You can watch the session live at https://app.saucelabs.com and review the video recording afterwards.

---

## Block 4 — Writing Test Cases (15 min)

### Re-seed helper

Tests that mutate data (borrow a book, add a member) leave the app in a different state. The re-seed button resets all data to the original 10 books, 8 members, 3 loans and 2 reservations.

```typescript
// tests/helpers.ts
export async function reseedApp() {
  // Navigate to More tab
  await $('~tab-more').click();

  // Tap the re-seed button
  await $('~seed-database-button').click();

  // Confirm in the native Alert (Android shows uppercase button text)
  const confirmBtn = await $('//*[@text="RESET & RESEED"]');
  await confirmBtn.waitForDisplayed({ timeout: 10_000 });
  await confirmBtn.click();

  // Wait for success alert and dismiss
  const okBtn = await $('//*[@text="OK"]');
  await okBtn.waitForDisplayed({ timeout: 10_000 });
  await okBtn.click();

  // Navigate back to Books tab
  await $('~tab-books').click();
}
```

### Scenario 1: Books list loads with seed data

```typescript
import { reseedApp } from './helpers';

describe('Library App - Full Suite', () => {
  before(async () => {
    // Wait for app to load
    const booksList = await $('~books-list');
    await booksList.waitForDisplayed({ timeout: 30_000 });
    // Reseed to guarantee clean state
    await reseedApp();
  });

  it('books list shows the seeded books', async () => {
    const booksList = await $('~books-list');
    await expect(booksList).toBeDisplayed();

    // Verify a known book title is visible
    const title1984 = await $('//*[@text="1984"]');
    await expect(title1984).toBeDisplayed();

    const titleAlchemist = await $('//*[@text="The Alchemist"]');
    await expect(titleAlchemist).toBeDisplayed();
  });
```

### Scenario 2: Borrow a book and verify availability decreases

```typescript
  it('borrowing a book decreases available copies', async () => {
    // Open book #1 detail
    await $('~book-item-1').click();

    // Read current copies text (e.g. "2/3 available")
    const copiesEl = await $('~book-detail-copies-1');
    await copiesEl.waitForDisplayed();
    const copiesText = await copiesEl.getText();
    const before = parseInt(copiesText.split('/')[0]);

    // Tap Borrow
    await $('~borrow-button-1').click();

    // An Alert appears with member names in UPPERCASE — pick Alice
    const aliceBtn = await $('//*[@text="ALICE MÜLLER"]');
    await aliceBtn.waitForDisplayed({ timeout: 10_000 });
    await aliceBtn.click();

    // Wait for success alert and dismiss
    const okBtn = await $('//*[@text="OK"]');
    await okBtn.waitForDisplayed({ timeout: 10_000 });
    await okBtn.click();

    // Verify copies decreased
    const copiesAfter = await $('~book-detail-copies-1').getText();
    const after = parseInt(copiesAfter.split('/')[0]);
    expect(after).toBe(before - 1);
  });
```

### Scenario 3: Return a loan and see the late fee

```typescript
  it('returning an overdue loan shows a late fee', async () => {
    // Navigate to Loans tab
    await $('~tab-loans').click();

    // Filter to overdue
    await $('~loans-filter-overdue').click();

    // Open loan 3 (seeded as overdue)
    await $('~loan-item-3').click();

    // Tap Return
    await $('~return-button-3').click();

    // Confirm in the dialog (uppercase on Android)
    const returnBtn = await $('//*[@text="RETURN"]');
    await returnBtn.waitForDisplayed({ timeout: 10_000 });
    await returnBtn.click();

    // Dismiss success alert
    const okBtn = await $('//*[@text="OK"]');
    await okBtn.waitForDisplayed({ timeout: 10_000 });
    await okBtn.click();

    // Verify fee is displayed
    const fee = await $('~loan-detail-fee-3');
    await expect(fee).toBeDisplayed();
    const feeText = await fee.getText();
    expect(feeText).toContain('€');
  });
```

### Scenario 4: Place a reservation

```typescript
  it('reserving a book creates a pending reservation', async () => {
    await $('~tab-books').click();
    await $('~book-item-4').click();

    // Reserve the book
    await $('~reserve-button-4').click();

    // Pick Alice from the alert
    const aliceBtn = await $('//*[@text="ALICE MÜLLER"]');
    await aliceBtn.waitForDisplayed({ timeout: 10_000 });
    await aliceBtn.click();

    // Dismiss success alert
    const okBtn = await $('//*[@text="OK"]');
    await okBtn.waitForDisplayed({ timeout: 10_000 });
    await okBtn.click();

    // Navigate to Reservations and verify
    await $('~tab-reservations').click();
    const resList = await $('~reservations-list');
    await expect(resList).toBeDisplayed();
  });
});
```

---

## Block 5 — Running the Suite & Viewing Results (5 min)

### Run the full suite
```bash
npx wdio run wdio.conf.ts
```

### Final suite structure
```
describe('Library App - Full Suite')
  ├── before: wait for app + reseed
  ├── it: books list shows seeded books          ✓
  ├── it: borrowing a book decreases copies      ✓
  ├── it: returning overdue loan shows fee       ✓
  ├── it: reserving a book creates reservation   ✓
  └── (afterAll: Sauce service marks pass/fail)
```

### Viewing results on Sauce Labs
After the run, go to https://app.saucelabs.com/test-results — you will see:
- **Video recording** of every test step on the real device
- **Screenshots** at each assertion
- **Appium logs** for debugging failures
- **Pass/fail status** per test

### Interpreting results
- **PASS** — assertion met
- **FAIL** — assertion not met; watch the video replay to see exactly what happened on device
- **TIMEOUT** — element not found within the wait timeout; check the `testID` spelling
- **Error: invalid credentials** — check `SAUCE_USERNAME` / `SAUCE_ACCESS_KEY` env vars

### Common issues & fixes

| Symptom | Cause | Fix |
|---|---|---|
| Element not found (`~book-item-1`) | App still loading | Add `waitForDisplayed({ timeout: 30000 })` |
| Alert button not found | Dialog dismissed too early | Increase `waitForDisplayed` timeout |
| Fee text missing | Test order issue — book wasn't overdue | Always call `reseedApp()` before tests |
| Device allocation timeout | No matching device available | Try a different `deviceName` in capabilities |
| APK not found | Wrong filename in `storage:filename` | Re-upload and verify the filename in App Management |

### Discussion prompts
1. Why is `testID` (accessibility id) better than XPath for production test suites?
2. What would break if a developer renamed `book-item-{id}` to `bookRow-{id}`?
3. What are the advantages of running on Sauce Labs vs a local emulator?
4. How would you integrate this suite into a CI/CD pipeline so it runs on every pull request?

---

## Appendix A — Sauce Labs Capabilities Reference

```json
{
  "platformName": "Android",
  "appium:automationName": "UiAutomator2",
  "appium:deviceName": "Google Pixel 7",
  "appium:platformVersion": "13",
  "appium:app": "storage:filename=FHBLibrary.apk",
  "appium:appPackage": "com.fhb.libraryandroid",
  "appium:appActivity": ".MainActivity",
  "appium:noReset": false,
  "appium:newCommandTimeout": 120,
  "sauce:options": {
    "appiumVersion": "2.0.0",
    "build": "FHB Library Lesson",
    "name": "My Test Name"
  }
}
```

**Sauce Labs endpoints:**

| Region | Endpoint |
|---|---|
| EU | `ondemand.eu-central-1.saucelabs.com/wd/hub` |
| US West | `ondemand.us-west-1.saucelabs.com/wd/hub` |

Browse available devices: https://app.saucelabs.com/live/mobile/virtual

## Appendix B — Uploading the APK

**Via cURL (EU data centre):**
```bash
curl -u "$SAUCE_USERNAME:$SAUCE_ACCESS_KEY" \
  -X POST "https://api.eu-central-1.saucelabs.com/v1/storage/upload" \
  -H "Content-Type: multipart/form-data" \
  -F "payload=@app-debug.apk" \
  -F "name=FHBLibrary.apk"

# Check uploaded apps
curl -u "$SAUCE_USERNAME:$SAUCE_ACCESS_KEY" \
  "https://api.eu-central-1.saucelabs.com/v1/storage/files?q=FHBLibrary"
```

**Via Sauce Labs UI:**
1. Go to https://app.saucelabs.com → **App Management** (left sidebar)
2. Click **Upload App**
3. Select your `app-debug.apk` file
4. The app appears in the list with the filename you can reference in capabilities

## Appendix C — WebdriverIO Locator Cheat Sheet

```typescript
// Accessibility ID (preferred — maps to testID in React Native)
const booksList = await $('~books-list');
const bookRow = await $('~book-item-3');

// XPath by text (fallback — fragile, use sparingly)
const heading = await $('//*[@text="Books"]');

// XPath by partial content-desc
const rows = await $$('//*[starts-with(@content-desc, "book-item-")]');
// $$ returns an array of elements

// Wait for element
await $('~books-list').waitForDisplayed({ timeout: 30_000 });

// Get text from an element
const text = await $('~book-copies-1').getText();

// Tap / click an element
await $('~borrow-button-1').click();

// Type into an input
await $('~search-input').setValue('1984');

// Scroll down (mobile gesture)
await driver.execute('mobile: scroll', { direction: 'down' });

// Mark Sauce Labs test as passed/failed
await driver.execute('sauce:job-result=passed');
```
