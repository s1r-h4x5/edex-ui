# eDEX-UI Utilities Quick Reference

## Logger

```javascript
const Logger = require("./utils/Logger");
const logger = new Logger("myModule");

// Basic logging
logger.error("Something failed", { code: 500 });
logger.warn("This is deprecated");
logger.info("Operation started");
logger.debug("Debug details", { data: obj });

// Child loggers
const childLogger = logger.child("submodule");

// Timing operations
const stop = logger.time("operation");
// ... do work ...
stop();  // Automatically logs duration
```

## Error Handler

```javascript
const {
  AppError,
  wrapAsync,
  wrapSync,
  safeCall,
  retry,
  getErrorMessage
} = require("./utils/errorHandler");

// Wrap functions
const myAsync = wrapAsync(async (url) => {
  return await fetch(url);
}, "fetch_data");

const mySync = wrapSync((str) => {
  return JSON.parse(str);
}, "parse_json");

// Retry with backoff
await retry(async () => {
  return await unstableApi();
}, { maxRetries: 3, delay: 1000 });

// Safe call with fallback
const value = safeCall(() => riskyOp(), "default");

// Custom error
throw new AppError("Failed", "CODE", { context: "data" });
```

## Settings Validator

```javascript
const {
  validateSettings,
  migrateSettings,
  getDefaultSettings,
  SettingsSchema
} = require("./utils/settingsValidator");

// Get defaults
const defaults = getDefaultSettings();

// Validate settings
const settings = validateSettings(loadedSettings);

// Migrate settings
const migrated = migrateSettings(oldSettings, 1);
```

## IPC Manager

```javascript
// Main Process
const { createMainIPCManager } = require("./utils/ipcManager");
const ipc = createMainIPCManager(require("electron").ipcMain);

// Register listeners
ipc.on("user-action", (args) => {
  console.log(args);
});

// Register request handlers
ipc.onRequest("get-config", async () => {
  return await loadConfig();
});

// Renderer Process
const { createRendererIPCManager } = require("./utils/ipcManager");
const ipc = createRendererIPCManager(require("electron").ipcRenderer);

// Send events
ipc.send("user-action", { action: "click" });

// Make requests
const config = await ipc.request("get-config", {}, 5000);
```

## Common Patterns

### Initialize Module Safely
```javascript
const { initWithFallback } = require("./utils/errorHandler");

const geoip = initWithFallback(
  "geoip",
  () => require("geoip"),
  null  // fallback if fails
);
```

### Log and Handle Errors
```javascript
const logger = new Logger("myModule");
const { retry } = require("./utils/errorHandler");

try {
  const result = await retry(async () => {
    return await externalApi();
  });
  logger.info("Operation succeeded", { result });
} catch (error) {
  logger.error("Failed after retries", {
    error: error.message,
    code: error.code
  });
}
```

### Validate User Input
```javascript
const { validateSettings } = require("./utils/settingsValidator");

try {
  const validated = validateSettings(userInput);
  saveSettings(validated);
} catch (error) {
  logger.error("Invalid settings", { error: error.message });
  throw error;
}
```

### Deploy with Tests
```bash
npm run lint:fix     # Fix code style
npm test             # Run tests
npm run build-linux  # Build application
```

## Environment Variables

```bash
# Enable debug logging
LOG_LEVEL=debug npm start

# Run tests with coverage
npm test -- --coverage

# Run specific test
npm test -- myTest.test.js
```

## npm Scripts

```bash
# Development
npm start              # Run application
npm run lint           # Check style
npm run lint:fix       # Auto-fix style
npm test               # Run tests
npm test -- --watch   # Watch mode

# Building
npm run prebuild-linux
npm run build-linux
npm run prebuild-darwin
npm run build-darwin
npm run prebuild-windows
npm run build-windows

# Maintenance
npm run init-file-icons
npm run update-file-icons
```

## Git Workflow

```bash
# Create feature
git checkout -b feat/my-feature

# Make changes and test
npm run lint:fix
npm test

# Commit (message is validated)
git commit -m "feat(scope): description"

# Push
git push origin feat/my-feature

# Create PR on GitHub
```

## Troubleshooting

```bash
# Dependency issues
npm ci && cd src && npm ci && cd ..

# Test failures
npm test -- --clearCache
npm test -- --watch

# Type check
npx tsc --noEmit

# Build issues
npm run install-linux
npm run prebuild-linux

# Git hooks not running
npx husky install
```

## Code Examples

### Module with Proper Error Handling
```javascript
const Logger = require("../utils/Logger");
const { wrapAsync, retry } = require("../utils/errorHandler");

class MyModule {
  constructor() {
    this.logger = new Logger("MyModule");
  }

  async initialize() {
    const stop = this.logger.time("initialization");
    try {
      await this.setup();
      this.logger.info("Module initialized");
      stop();
    } catch (error) {
      this.logger.error("Initialization failed", { error: error.message });
      throw error;
    }
  }

  setup = wrapAsync(async () => {
    return await retry(async () => {
      // dangerous operation
    }, { maxRetries: 3 });
  }, "setup");
}
```

### Settings with Validation
```javascript
const { validateSettings, getDefaultSettings } = 
  require("../utils/settingsValidator");
const Logger = require("../utils/Logger");

const logger = new Logger("config");

function loadSettings(filePath) {
  try {
    const raw = JSON.parse(fs.readFileSync(filePath));
    return validateSettings(raw);
  } catch (error) {
    logger.warn("Using default settings", { error: error.message });
    return getDefaultSettings();
  }
}
```

### IPC Communication
```javascript
const { createMainIPCManager } = require("../utils/ipcManager");
const Logger = require("../utils/Logger");

const logger = new Logger("ipc");
const ipc = createMainIPCManager(require("electron").ipcMain);

ipc.onRequest("cpu-info", async () => {
  logger.debug("CPU info requested");
  return await getCpuInfo();
});

ipc.on("terminal-resize", (args) => {
  logger.debug("Terminal resized", { cols: args.cols, rows: args.rows });
  resizeTerminal(args);
});
```

---

For detailed documentation, see:
- `ENHANCEMENTS.md` - Full technical reference
- `DEVELOPMENT.md` - Development workflow guide
- Source files in `src/utils/` - Implementation details
