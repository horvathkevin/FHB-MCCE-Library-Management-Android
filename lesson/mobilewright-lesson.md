# Mobile Test Automation with Mobilewright
## FHB 2026 — Lesson Script (~60 minutes)

---

## Learning Goals
By the end of this lesson students will be able to:
1. Explain what Appium is and how Mobilewright wraps it
2. Connect an Android device/emulator and inspect UI elements
3. Write Mobilewright test cases using `testID`-based locators
4. Use the re-seed button to reset app state between test runs
5. Run a small test suite and interpret results

---

## Prerequisites (done before the lesson)
- Android Studio installed with at least one AVD (API 33+) or a physical device with USB debugging enabled
- Node.js 18+ and npm installed
- Appium 2 installed globally: `npm install -g appium`
- Appium UiAutomator2 driver: `appium driver install uiautomator2`
- Mobilewright installed: `npm install -g mobilewright` *(or per project)*
- The FHB Library Android app built and installed on the device/emulator
  - Run `npx expo run:android` from the project root once to install the debug APK

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
UiAutomator2 Driver
     ↓
Android device / emulator
```

### The app we are testing
The **FHB Library App** is a library management system. It manages books, members, loans, and reservations — all stored locally in SQLite on the device. There is no backend.

---

## Block 1 — Setup & First Command (10 min)

### Step 1: Start the emulator
Open Android Studio → Device Manager → Start your AVD.
Or start it from the command line:
```bash
emulator -avd Pixel_7_API_33
```

### Step 2: Verify ADB sees the device
```bash
adb devices
# Expected output:
# emulator-5554   device
```

### Step 3: Start Appium server
Open a terminal and run:
```bash
appium
```
Leave this terminal running. Appium listens on `http://localhost:4723` by default.

### Step 4: Create a test project
```bash
mkdir library-tests && cd library-tests
npm init -y
npm install mobilewright
```

### Step 5: Write your first test (`tests/smoke.test.ts`)
```typescript
import { createDriver, by, expect } from 'mobilewright';

const CAPS = {
  platformName: 'Android',
  'appium:deviceName': 'emulator-5554',
  'appium:appPackage': 'com.fhb.libraryandroid',
  'appium:appActivity': '.MainActivity',
  'appium:automationName': 'UiAutomator2',
  'appium:noReset': true,
};

describe('Library App - Smoke', () => {
  let driver: any;

  beforeAll(async () => {
    driver = await createDriver({ serverUrl: 'http://localhost:4723', capabilities: CAPS });
  });

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

**Expected result:** Test passes — the books list is visible after launch.

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
const heading = await driver.findElement(by.xpath('//android.widget.TextView[@text="Books"]'));
```

### Complete testID reference for this app

| Element | testID |
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

### Exercise 2A (hands-on, ~5 min)
Use Appium Inspector to confirm the `content-desc` of a few elements:
1. Connect Inspector to `http://localhost:4723`
2. Use the same capability JSON from Block 1
3. Click "Start Session", then tap on a book row
4. In the attribute panel, find `content-desc` — it should read `book-item-1` (or similar)

---

## Block 3 — Writing Test Cases (15 min)

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
  // On Android, Alert buttons are native dialogs
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

  // Tap Return Book
  const loanId = /* known from seed */ 3;
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
  // Book #1 should have 0 available copies after Scenario 2 reduced it
  await driver.findElement(by.accessibilityId('tab-books')).click();
  await driver.findElement(by.accessibilityId('book-item-1')).click();

  // Borrow button should be disabled; reserve should be enabled
  await driver.findElement(by.accessibilityId(`reserve-button-1`)).click();

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
Tests that mutate data (borrow a book, add a member) leave the app in a different state. Without resetting, tests depend on each other — a classic problem in test automation called **test pollution**.

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
describe('Library App - Full Suite', () => {
  let driver: any;

  beforeAll(async () => {
    driver = await createDriver({ serverUrl: 'http://localhost:4723', capabilities: CAPS });
    await reseedApp(driver); // guaranteed clean state
  });

  afterAll(async () => { await driver.quit(); });

  // ...tests here...
});
```

### Exercise 4A
1. Add `beforeAll` with `reseedApp` to your test file
2. Run the full suite twice in a row — results should be identical both times
3. Without `reseedApp`, run twice — observe how the second run fails

---

## Block 5 — Running the Suite & Discussion (5 min)

### Final suite structure (`tests/library.test.ts`)
```
describe('Library App - Full Suite')
  ├── beforeAll: launch driver + reseed
  ├── test: books list loads with 10 books        ✓
  ├── test: borrow a book decreases copies        ✓
  ├── test: return overdue loan shows fee         ✓
  ├── test: place reservation                     ✓
  └── afterAll: quit driver
```

Run:
```bash
npx mobilewright run tests/library.test.ts --reporter verbose
```

### Interpreting results
- **PASS** — assertion met
- **FAIL** — assertion not met; look at the error message and screenshot Mobilewright saves automatically
- **TIMEOUT** — element not found within the wait timeout; check the `testID` spelling

### Common issues & fixes

| Symptom | Cause | Fix |
|---|---|---|
| `NoSuchElementException` on `book-item-1` | App still loading | Add `await driver.waitForElement(...)` |
| Alert button not found | Dialog dismissed before search | Increase Appium implicit wait |
| Fee text missing | Test order issue — book wasn't overdue | Always reseed before the suite |
| `appPackage` wrong | App reinstalled with different ID | Check `adb shell pm list packages | grep fhb` |

### Discussion prompts
1. Why is `testID` better than XPath for production test suites?
2. What would break if a developer renamed `book-item-{id}` to `bookRow-{id}`?
3. How would you integrate this suite into a CI pipeline?
4. What other scenarios would you automate for this app?

---

## Appendix A — Capabilities Quick Reference

```json
{
  "platformName": "Android",
  "appium:deviceName": "emulator-5554",
  "appium:appPackage": "com.fhb.libraryandroid",
  "appium:appActivity": ".MainActivity",
  "appium:automationName": "UiAutomator2",
  "appium:noReset": true,
  "appium:newCommandTimeout": 120
}
```

For a physical device, replace `emulator-5554` with the device serial from `adb devices`.

## Appendix B — Finding the App Package Name

```bash
# After installing via Expo
adb shell pm list packages | findstr fhb
# or on macOS/Linux:
adb shell pm list packages | grep fhb
```

## Appendix C — Useful Appium Commands

```typescript
// Wait for element (up to 10 s)
await driver.waitForElement(by.accessibilityId('books-list'), 10000);

// Scroll down
await driver.execute('mobile: scroll', { direction: 'down' });

// Take a screenshot
await driver.saveScreenshot('./screenshot.png');

// Get all elements matching a pattern
const items = await driver.findElements(
  by.xpath('//*[starts-with(@content-desc, "book-item-")]')
);
```
