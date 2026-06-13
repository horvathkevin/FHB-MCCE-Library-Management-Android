# Mobile Test Automation with Mobilewright
## FHB 2026 — Lesson Script (~60 minutes)

---

## Learning Goals
By the end of this lesson students will be able to:
1. Explain what Appium is and how Mobilewright wraps it
2. Upload an APK to Sauce Labs and inspect UI elements with Appium Inspector
3. Write Mobilewright test cases using `testID`-based locators
4. Use the re-seed button to reset app state between test runs
5. Run a small test suite against a real cloud device on Sauce Labs

---

## Prerequisites (done before the lesson)
- Node.js 18+ and npm installed
- A Sauce Labs account — free trial at https://saucelabs.com
  - **`SAUCE_USERNAME`** and **`SAUCE_ACCESS_KEY`** set as environment variables
- Mobilewright installed per project: `npm install mobilewright`
- The FHB Library APK downloaded from GitHub Actions
  - Go to the repo → Actions → latest "Build Debug APK" run → Artifacts → download `FHBLibrary-debug-apk.zip`
  - Unzip to get `app-debug.apk`

---

## Block 0 — Introduction (5 min)

### What is Appium?
Appium is an open-source automation framework for mobile apps. It exposes a WebDriver-compatible API that lets you control Android and iOS apps programmatically — tapping buttons, filling inputs, reading text.

### What is Mobilewright?
Mobilewright is an AI-assisted Appium wrapper that lets you write tests in plain TypeScript/JavaScript with a cleaner API than raw Appium. It handles driver lifecycle, element waits, and assertions.

```
Your test code
     ↓
Mobilewright (clean API + AI helpers)
     ↓
Appium Server (WebDriver protocol)
     ↓
Sauce Labs Real Device Cloud
     ↓
Real Android device in a data centre
```

### What is Sauce Labs?
Sauce Labs is a cloud platform that provides real physical Android and iOS devices you can run Appium tests against — no local emulator or USB cable needed. You upload your APK once, and Sauce Labs installs it on the device for each test session.

### The app we are testing
The **FHB Library App** is a library management system. It manages books, members, loans, and reservations — all stored locally in SQLite on the device. There is no backend.

---

## Block 1 — Setup & First Command (10 min)

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
Sauce Labs needs the APK in its storage before tests can run.

```bash
curl -u "$SAUCE_USERNAME:$SAUCE_ACCESS_KEY" \
  -X POST "https://api.eu-central-1.saucelabs.com/v1/storage/upload" \
  -H "Content-Type: multipart/form-data" \
  -F "payload=@app-debug.apk" \
  -F "name=FHBLibrary.apk"
```

> **Note:** Use `api.us-west-1.saucelabs.com` if your account is on the US data centre.

The response contains a `storage:filename` ID — copy it, you will need it for the capabilities:
```json
{ "item": { "id": "abc123...", "storage_id": "abc123..." } }
```

You can also upload via the Sauce Labs web UI: **App Management → Upload App**.

### Step 3: Create a test project
```bash
mkdir library-tests && cd library-tests
npm init -y
npm install mobilewright
```

### Step 4: Write your first test (`tests/smoke.test.ts`)

```typescript
import { createDriver, by, expect } from 'mobilewright';

// Sauce Labs EU endpoint — change to us-west-1 if on US data centre
const SAUCE_URL =
  `https://${process.env.SAUCE_USERNAME}:${process.env.SAUCE_ACCESS_KEY}` +
  `@ondemand.eu-central-1.saucelabs.com/wd/hub`;

const CAPS = {
  platformName: 'Android',
  'appium:automationName': 'UiAutomator2',
  // Target device — pick any from https://app.saucelabs.com/live/mobile/virtual
  'appium:deviceName': 'Google Pixel 7',
  'appium:platformVersion': '13',
  // APK uploaded in Step 2
  'sauce:options': {
    appiumVersion: '2.0.0',
    build: 'FHB Library Lesson',
    name: 'Smoke Test',
  },
  'appium:app': 'storage:filename=FHBLibrary.apk',
  'appium:appPackage': 'com.fhb.libraryandroid',
  'appium:appActivity': '.MainActivity',
  'appium:noReset': false,   // fresh install each session on Sauce Labs
  'appium:newCommandTimeout': 120,
};

describe('Library App - Smoke', () => {
  let driver: any;

  beforeAll(async () => {
    driver = await createDriver({ serverUrl: SAUCE_URL, capabilities: CAPS });
  }, 120_000); // allow 2 min for device allocation

  afterAll(async () => {
    await driver.quit();
  });

  test('app launches and shows Books tab', async () => {
    const booksList = await driver.findElement(by.accessibilityId('books-list'));
    await expect(booksList).toBeDisplayed();
  });
});
```

Run it:
```bash
npx mobilewright run tests/smoke.test.ts
```

**Expected result:** Sauce Labs allocates a real Pixel 7, installs the APK, and the test passes. You can watch the session live at https://app.saucelabs.com/live/mobile.

---

## Block 2 — Locator Strategies (15 min)

### Why locators matter
A locator tells Appium *which* element to interact with. If locators break when the UI changes, tests break. We use `testID` props in React Native, which map to the `content-desc` attribute on Android.

### The three strategies we use in this app

#### 1. Accessibility ID (preferred)
Maps to `testID` in React Native → `content-desc` in Android.
```typescript
// Find the search input (testID="search-input")
const input = await driver.findElement(by.accessibilityId('search-input'));
```

#### 2. Dynamic accessibility IDs (parameterized)
Many elements include the item's `id` in their `testID`:
```typescript
// testID="book-item-3"  — the row for book with id=3
const bookRow = await driver.findElement(by.accessibilityId('book-item-3'));

// testID="return-button-7"  — return button for loan id=7
const returnBtn = await driver.findElement(by.accessibilityId('return-button-7'));
```

#### 3. Text / XPath (fallback)
Use sparingly — breaks easily when copy changes.
```typescript
const heading = await driver.findElement(
  by.xpath('//android.widget.TextView[@text="Books"]')
);
```

### Complete testID reference for this app

| Element | testID / locator |
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

### Exercise 2A — Inspect elements with Appium Inspector (hands-on, ~5 min)
Appium Inspector can connect directly to a live Sauce Labs session.

1. Download Appium Inspector: https://github.com/appium/appium-inspector/releases
2. Set the Remote Path to `/wd/hub` and the server to `ondemand.eu-central-1.saucelabs.com`
3. Paste the same capabilities JSON from Block 1 (add your credentials to `sauce:options`)
4. Click **Start Session** — Inspector opens a live view of the device
5. Click on a book row → find `content-desc` in the attribute panel (should read `book-item-1`)

---

## Block 3 — Writing Test Cases (15 min)

Add a shared driver setup file (`tests/setup.ts`) to avoid repeating the Sauce Labs config:

```typescript
// tests/setup.ts
export const SAUCE_URL =
  `https://${process.env.SAUCE_USERNAME}:${process.env.SAUCE_ACCESS_KEY}` +
  `@ondemand.eu-central-1.saucelabs.com/wd/hub`;

export const BASE_CAPS = {
  platformName: 'Android',
  'appium:automationName': 'UiAutomator2',
  'appium:deviceName': 'Google Pixel 7',
  'appium:platformVersion': '13',
  'appium:app': 'storage:filename=FHBLibrary.apk',
  'appium:appPackage': 'com.fhb.libraryandroid',
  'appium:appActivity': '.MainActivity',
  'appium:noReset': false,
  'appium:newCommandTimeout': 120,
};
```

### Scenario 1: Books list loads with seed data

```typescript
test('books list shows at least 10 books', async () => {
  // Navigate to Books tab
  await driver.findElement(by.accessibilityId('tab-books')).click();

  // Wait for the list
  const list = await driver.findElement(by.accessibilityId('books-list'));
  await expect(list).toBeDisplayed();

  // Count rows using XPath
  const rows = await driver.findElements(
    by.xpath('//*[starts-with(@content-desc, "book-item-")]')
  );
  expect(rows.length).toBeGreaterThanOrEqual(10);
});
```

### Scenario 2: Borrow a book and verify availability decreases

```typescript
test('borrowing a book decreases available copies', async () => {
  // Open book #1 detail
  await driver.findElement(by.accessibilityId('book-item-1')).click();

  // Read current copies text (e.g. "3/3 available")
  const copiesText = await driver
    .findElement(by.accessibilityId('book-detail-copies-1'))
    .getText();
  const before = parseInt(copiesText.split('/')[0]);

  // Tap Borrow
  await driver.findElement(by.accessibilityId('borrow-button-1')).click();

  // An Alert appears with member names — pick the first one
  await driver.findElement(by.xpath('//android.widget.Button[1]')).click();

  // Wait for success alert and dismiss
  await driver.findElement(by.xpath('//android.widget.Button[@text="OK"]')).click();

  // Verify copies decreased
  const copiesAfter = await driver
    .findElement(by.accessibilityId('book-detail-copies-1'))
    .getText();
  const after = parseInt(copiesAfter.split('/')[0]);
  expect(after).toBe(before - 1);
});
```

### Scenario 3: Return a loan and see the late fee

```typescript
test('returning an overdue loan shows a late fee', async () => {
  // Navigate to Loans tab
  await driver.findElement(by.accessibilityId('tab-loans')).click();

  // Filter to overdue
  await driver.findElement(by.accessibilityId('loans-filter-overdue')).click();

  // Open the first overdue loan
  const overdueLoans = await driver.findElements(
    by.xpath('//*[starts-with(@content-desc, "loan-item-")]')
  );
  expect(overdueLoans.length).toBeGreaterThan(0);
  await overdueLoans[0].click();

  // Tap Return Book (loan id 3 is the seeded overdue loan)
  const loanId = 3;
  await driver.findElement(by.accessibilityId(`return-button-${loanId}`)).click();

  // Confirm in the dialog
  await driver.findElement(by.xpath('//android.widget.Button[@text="Return"]')).click();

  // Dismiss success alert
  await driver.findElement(by.xpath('//android.widget.Button[@text="OK"]')).click();

  // Verify fee is displayed
  const fee = await driver.findElement(by.accessibilityId(`loan-detail-fee-${loanId}`));
  await expect(fee).toBeDisplayed();
  const feeText = await fee.getText();
  expect(feeText).toContain('€');
});
```

### Scenario 4: Place a reservation

```typescript
test('reserving a fully-borrowed book creates a pending reservation', async () => {
  await driver.findElement(by.accessibilityId('tab-books')).click();
  await driver.findElement(by.accessibilityId('book-item-1')).click();

  // Reserve the book
  await driver.findElement(by.accessibilityId('reserve-button-1')).click();

  // Pick the first member from the alert
  await driver.findElement(by.xpath('//android.widget.Button[1]')).click();
  await driver.findElement(by.xpath('//android.widget.Button[@text="OK"]')).click();

  // Navigate to Reservations and verify
  await driver.findElement(by.accessibilityId('tab-reservations')).click();
  const res = await driver.findElement(
    by.xpath('//*[starts-with(@content-desc, "reservation-item-")]')
  );
  await expect(res).toBeDisplayed();
});
```

---

## Block 4 — Re-seed Workflow (10 min)

### Why re-seed?
Tests that mutate data (borrow a book, add a member) leave the app in a different state. Without resetting, tests depend on each other — a classic problem called **test pollution**.

On Sauce Labs, `'appium:noReset': false` gives a fresh app install at the start of each **session** — but not between individual tests within a session. The re-seed button handles that within-session reset.

The re-seed button wipes all data and inserts the original 10 books, 8 members, 3 loans and 2 reservations.

### Re-seed as a `beforeAll` helper

```typescript
async function reseedApp(driver: any) {
  // Navigate to More tab
  await driver.findElement(by.accessibilityId('tab-more')).click();

  // Tap the re-seed button
  await driver.findElement(by.accessibilityId('seed-database-button')).click();

  // Confirm in the native Alert
  await driver.findElement(
    by.xpath('//android.widget.Button[@text="Reset & Reseed"]')
  ).click();

  // Wait for success alert and dismiss
  await driver.findElement(
    by.xpath('//android.widget.Button[@text="OK"]')
  ).click();

  // Navigate back to Books tab
  await driver.findElement(by.accessibilityId('tab-books')).click();
}
```

### Using it in your test suite

```typescript
import { createDriver, by, expect } from 'mobilewright';
import { SAUCE_URL, BASE_CAPS } from './setup';

describe('Library App - Full Suite', () => {
  let driver: any;

  beforeAll(async () => {
    driver = await createDriver({
      serverUrl: SAUCE_URL,
      capabilities: {
        ...BASE_CAPS,
        'sauce:options': {
          appiumVersion: '2.0.0',
          build: 'FHB Library - Full Suite',
          name: 'Library Full Suite',
        },
      },
    });
    await reseedApp(driver); // guaranteed clean state
  }, 120_000);

  afterAll(async () => { await driver.quit(); });

  // ...tests here...
});
```

### Exercise 4A
1. Add `beforeAll` with `reseedApp` to your test file
2. Run the full suite twice — results should be identical both times
3. Remove the `reseedApp` call, run twice — observe how the second run fails

---

## Block 5 — Running the Suite & Viewing Results (5 min)

### Run the full suite
```bash
npx mobilewright run tests/library.test.ts --reporter verbose
```

### Final suite structure
```
describe('Library App - Full Suite')
  ├── beforeAll: allocate Sauce Labs device + reseed
  ├── test: books list loads with 10 books        ✓
  ├── test: borrow a book decreases copies        ✓
  ├── test: return overdue loan shows fee         ✓
  ├── test: place reservation                     ✓
  └── afterAll: quit driver (releases device)
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
| `NoSuchElementException` on `book-item-1` | App still loading | Add `await driver.waitForElement(...)` |
| Alert button not found | Dialog dismissed before search | Increase Appium implicit wait |
| Fee text missing | Test order issue — book wasn't overdue | Always call `reseedApp` before tests |
| Device allocation timeout | No matching device available | Try a different `deviceName` in capabilities |
| APK not found | Wrong filename in `storage:filename` | Re-upload and verify the exact filename |

### Discussion prompts
1. Why is `testID` better than XPath for production test suites?
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

## Appendix B — Uploading the APK via curl

```bash
# EU data centre
curl -u "$SAUCE_USERNAME:$SAUCE_ACCESS_KEY" \
  -X POST "https://api.eu-central-1.saucelabs.com/v1/storage/upload" \
  -H "Content-Type: multipart/form-data" \
  -F "payload=@app-debug.apk" \
  -F "name=FHBLibrary.apk"

# Check uploaded apps
curl -u "$SAUCE_USERNAME:$SAUCE_ACCESS_KEY" \
  "https://api.eu-central-1.saucelabs.com/v1/storage/files?q=FHBLibrary"
```

## Appendix C — Useful Mobilewright / Appium Commands

```typescript
// Wait for element (up to 10 s)
await driver.waitForElement(by.accessibilityId('books-list'), 10000);

// Scroll down
await driver.execute('mobile: scroll', { direction: 'down' });

// Take a screenshot (also done automatically by Sauce Labs)
await driver.saveScreenshot('./screenshot.png');

// Get all elements matching a pattern
const items = await driver.findElements(
  by.xpath('//*[starts-with(@content-desc, "book-item-")]')
);

// Tag a Sauce Labs test as passed/failed programmatically
await driver.execute('sauce:job-result=passed');
await driver.execute('sauce:job-result=failed');
```
