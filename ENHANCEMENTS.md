# eDEX-UI Enhancements & Utilities Documentation

## Overview

This document outlines the comprehensive improvements made to the eDEX-UI project to enhance code quality, maintainability, and reliability.

## Table of Contents

1. [Dependency Updates](#dependency-updates)
2. [TypeScript Support](#typescript-support)
3. [Logging System](#logging-system)
4. [Error Handling](#error-handling)
5. [Settings Validation](#settings-validation)
6. [IPC Abstraction](#ipc-abstraction)
7. [Testing Framework](#testing-framework)
8. [Linting & Code Quality](#linting--code-quality)
9. [CI/CD Pipeline](#cicd-pipeline)
10. [Git Hooks](#git-hooks)

---

## Dependency Updates

All production and development dependencies have been updated to their latest stable versions:

### Major Updates
- **Electron**: `^12.1.0` → `^25.9.8`
- **xterm**: `4.14.1` → `^4.22.2`
- **node-pty**: `0.10.1` → `^0.11.0-beta16`
- **systeminformation**: `5.9.7` → `^5.15.13`
- **ws**: `7.5.5` → `^8.16.0`
- **color**: `3.2.1` → `^4.2.3`

### Security Benefits
- Thousands of security patches applied
- Updated vulnerable dependencies
- Better compatibility with modern Node.js

### Installation

```bash
npm ci  # Clean install with locked versions
cd src && npm ci && cd ..
npm install  # For development
```

---

## TypeScript Support

Full TypeScript configuration is now available for gradual migration.

### Configuration Files
- `/tsconfig.json` - Root configuration
- `/src/tsconfig.json` - Source configuration

### Features
- JSDoc support for type hints in JavaScript
- Optional strict mode (currently disabled for gradual migration)
- Source map generation for debugging
- Support for both CommonJS and modern JavaScript

### Usage

```bash
# Type check without compilation
npx tsc --noEmit

# Migrate individual files to TypeScript (.ts)
# The build system will handle both .js and .ts files
```

### Migration Strategy
Start by adding JSDoc comments to critical classes, then gradually convert to `.ts` files as needed.

---

## Logging System

A robust logging utility has been implemented for structured logging throughout the application.

### Location
`src/utils/Logger.js`

### Features
- **Log Levels**: error, warn, info, debug
- **Structured Logging**: JSON context support
- **Namespacing**: Hierarchical logger names
- **Filtering**: Log level-based filtering
- **Timestamps**: ISO 8601 timestamps

### Usage

```javascript
const Logger = require("./utils/Logger");
const logger = new Logger("myModule");

// Basic logging
logger.info("Application started");
logger.warn("Deprecated feature used", { feature: "oldAPI" });
logger.error("Failed to connect", { retries: 3 });
logger.debug("Debug information", { data: someObject });

// Create child logger for submodules
const childLogger = logger.child("submodule");
childLogger.info("Submodule message");

// Time operations
const stop = logger.time("Database query");
// ... perform operation ...
stop(); // Logs duration automatically
```

### Environment Variables
```bash
LOG_LEVEL=debug  # error, warn, info, debug
```

---

## Error Handling

Comprehensive error handling utilities prevent crashes and improve debugging.

### Location
`src/utils/errorHandler.js`

### Features

#### AppError Class
Custom error class with code, context, and timestamps:

```javascript
const { AppError } = require("./utils/errorHandler");

throw new AppError(
  "Failed to load config",
  "CONFIG_LOAD_ERROR",
  { file: "settings.json" }
);
```

#### Error Wrapping
Automatic error catching and logging:

```javascript
const { wrapAsync, wrapSync } = require("./utils/errorHandler");

// Async function wrapper
const fetchData = wrapAsync(async (url) => {
  const response = await fetch(url);
  return response.json();
}, "fetch_data");

// Sync function wrapper
const parseJSON = wrapSync((str) => {
  return JSON.parse(str);
}, "parse_json");
```

#### Retry Logic
Exponential backoff retry mechanism:

```javascript
const { retry } = require("./utils/errorHandler");

await retry(async () => {
  return await unstableOperation();
}, {
  maxRetries: 3,
  delay: 1000,
  backoffMultiplier: 2,
  context: "unstable_operation"
});
```

#### Safe Calls
Graceful degradation with default values:

```javascript
const { safeCall } = require("./utils/errorHandler");

const value = safeCall(
  () => riskyOperation(),
  "default_value"  // returned if error occurs
);
```

---

## Settings Validation

Runtime validation ensures settings integrity.

### Location
`src/utils/settingsValidator.js`

### Features
- **Zod Schema**: Type-safe validation
- **Migrations**: Version-based setting upgrades
- **Defaults**: Sensible fallback values
- **Strict Validation**: Rejects invalid settings

### Usage

```javascript
const { validateSettings, migrateSettings, getDefaultSettings } = 
  require("./utils/settingsValidator");

// Load and validate
const rawSettings = JSON.parse(settingsFile);
const settings = validateSettings(rawSettings);

// Migrate old format
const oldSettings = { version: 1, shell: "bash" };
const newSettings = migrateSettings(oldSettings, 1);

// Get defaults
const defaults = getDefaultSettings();
```

### Validation Schema
Settings are validated for:
- Type correctness (string, number, boolean)
- Range validity (e.g., port 1024-65535)
- Option whitelisting (e.g., theme names)

---

## IPC Abstraction

Cleaner event-based interface for Electron IPC communication.

### Location
`src/utils/ipcManager.js`

### Features
- **Event Emitter Pattern**: Familiar EventEmitter API
- **Request/Response**: Promise-based request-response
- **Channel Management**: Organized message passing
- **Timeout Handling**: Automatic timeout detection

### Usage

```javascript
// Main Process
const { createMainIPCManager } = require("./utils/ipcManager");
const ipc = createMainIPCManager(require("electron").ipcMain);

// Register event handler
ipc.on("user-action", (args) => {
  console.log("User action:", args);
});

// Register request handler (with response)
ipc.onRequest("get-config", async () => {
  return await loadConfig();
});

// Renderer Process
const { createRendererIPCManager } = require("./utils/ipcManager");
const ipc = createRendererIPCManager(require("electron").ipcRenderer);

// Send event
ipc.send("user-action", { action: "click" });

// Send request and wait for response
const config = await ipc.request("get-config", {}, 5000);
```

---

## Testing Framework

Jest is configured for unit and integration testing.

### Configuration
- `jest.config.js` - Main Jest configuration
- `jest.setup.js` - Test environment setup
- `tests/` - Test files directory

### Running Tests

```bash
npm test                  # Run all tests
npm test -- --coverage   # With coverage report
npm test -- --watch      # Watch mode
```

### Writing Tests

```javascript
// tests/myModule.test.js
const myModule = require("../src/myModule");

describe("myModule", () => {
  test("should do something", () => {
    const result = myModule.doSomething();
    expect(result).toBe(expected);
  });
});
```

### Coverage Thresholds
- Branches: 50%
- Functions: 50%
- Lines: 50%
- Statements: 50%

---

## Linting & Code Quality

ESLint enforces consistent code style.

### Configuration
`.eslintrc.json` includes rules for:
- Variable declaration (`const`/`let` over `var`)
- Semicolon enforcement
- Quote consistency
- Spacing and formatting
- JSDoc documentation

### Commands

```bash
npm run lint          # Check code style
npm run lint:fix      # Auto-fix common issues
```

### Key Rules
- `semi`: Require semicolons
- `quotes`: Use double quotes
- `eqeqeq`: Use strict equality (`===`)
- `curly`: Require braces for blocks
- `prefer-const`: Prefer `const` over `let`

---

## CI/CD Pipeline

GitHub Actions automate testing, linting, and building.

### Workflow: `.github/workflows/ci.yml`

#### Jobs

1. **Lint** (Ubuntu)
   - Runs ESLint on all source files
   - Fails if linting errors found

2. **Test** (Ubuntu)
   - Executes Jest test suite
   - Uploads coverage to Codecov
   - Enforces minimum coverage

3. **Security** (Ubuntu)
   - npm audit for vulnerable packages
   - Snyk scan for advanced security issues

4. **Build** (Ubuntu, macOS, Windows)
   - Builds application for all platforms
   - Uploads artifacts to GitHub
   - Skips failures to ensure other jobs run

5. **Type Check** (Ubuntu)
   - TypeScript validation (non-blocking)

### Triggering Builds
- On push to: `master`, `revamperized`, `develop`
- On pull requests to these branches
- Manual trigger available

---

## Git Hooks

Husky and Commitlint enforce quality standards automatically.

### Configuration
- `commitlint.config.js` - Commit message rules
- `.husky/pre-commit` - Pre-commit hooks
- `.husky/commit-msg` - Commit message validation

### Installation

```bash
npm install  # Automatically installs husky hooks
```

### Commit Message Format

```
type(scope): subject

body

footer
```

**Valid types**: feat, fix, docs, style, refactor, perf, test, chore, ci, revert

**Example**:
```
feat(terminal): add color filter support

- Implemented custom color filters
- Added validation for filter expressions
- Closes #123
```

### Pre-commit Hook
Automatically runs `npm run lint:fix` before each commit to fix easy issues.

---

## Quick Start

### Setup Development Environment

```bash
# Install dependencies
npm ci
cd src && npm ci && cd ..

# Setup Git hooks
npx husky install

# Run linting
npm run lint:fix

# Run tests
npm test

# Type check
npx tsc --noEmit

# Start development
npm start
```

### Creating a New Feature

```bash
# Create feature branch
git checkout -b feat/my-feature

# Make changes and test
npm test
npm run lint:fix

# Commit with conventional message
git add .
git commit -m "feat(module): add new functionality"
# Husky validates the message and runs lint:fix

# Push and create PR
git push origin feat/my-feature
```

---

## Best Practices

### Logging
- Use appropriate log levels
- Include context in logs
- Avoid logging sensitive data

### Error Handling
- Wrap external operations
- Use retry for network operations
- Provide meaningful error messages

### Testing
- Write tests for public APIs
- Use descriptive test names
- Achieve minimum coverage thresholds

### Code Style
- Follow ESLint rules
- Use JSDoc for public APIs
- Keep functions small and focused

---

## Troubleshooting

### Dependency Issues
```bash
# Clean reinstall
rm -rf node_modules src/node_modules
npm ci && cd src && npm ci && cd ..
```

### Build Failures
```bash
# Check TypeScript
npx tsc --noEmit

# Check linting
npm run lint

# Check tests
npm test
```

### Husky Not Running Hooks
```bash
# Reinstall husky
npm install husky --save-dev
npx husky install
```

---

## References

- [Electron Documentation](https://www.electronjs.org/docs)
- [Jest Documentation](https://jestjs.io/)
- [ESLint Documentation](https://eslint.org/)
- [Zod Documentation](https://zod.dev/)
- [Commitlint Documentation](https://commitlint.js.org/)
- [Husky Documentation](https://typicode.github.io/husky/)
