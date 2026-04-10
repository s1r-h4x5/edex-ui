# eDEX-UI Development Guide

## Getting Started

### Prerequisites
- Node.js 18.17.0 (managed via `.nvmrc`)
- npm 9.0.0+
- Git

### Initial Setup

```bash
# Clone repository
git clone https://github.com/GitSquared/edex-ui.git
cd edex-ui

# Install Node version (with nvm)
nvm use

# Install dependencies
npm ci
cd src && npm ci && cd ..

# Setup git hooks
npx husky install

# Verify setup
npm run lint
npm test
```

## Development Workflow

### Making Changes

1. **Create a feature branch**
   ```bash
   git checkout -b feat/my-feature
   ```

2. **Make code changes**
   - Follow the code style (ESLint will help)
   - Add/update tests for new functionality
   - Update JSDoc comments

3. **Test locally**
   ```bash
   npm run lint:fix     # Fix code style issues
   npm test             # Run tests
   npm test -- --coverage  # Check coverage
   npx tsc --noEmit    # Type check
   ```

4. **Commit changes**
   ```bash
   git add .
   git commit -m "feat(module): description"  # Husky validates this
   ```

5. **Push and create PR**
   ```bash
   git push origin feat/my-feature
   # Open PR on GitHub
   ```

### Running the Application

```bash
# Development mode (with intro)
npm start

# Development mode without intro
npm start -- --nointro

# Production build
npm run prebuild-linux   # or darwin/windows
npm run build-linux      # or darwin/windows
```

## Project Structure

```
edex-ui/
├── src/
│   ├── classes/          # UI component classes
│   ├── utils/            # Utility modules (NEW)
│   ├── assets/           # Themes, icons, fonts
│   ├── _boot.js          # Main process entry
│   ├── _renderer.js      # Renderer process entry
│   └── ui.html           # Main window template
├── tests/                # Test files (NEW)
├── .github/workflows/    # CI/CD workflows (NEW)
├── .husky/               # Git hooks (NEW)
├── jest.config.js        # Jest configuration (NEW)
├── tsconfig.json         # TypeScript config (NEW)
└── ENHANCEMENTS.md       # Enhancement docs (NEW)
```

## Available Scripts

### Development
- `npm start` - Start application
- `npm run lint` - Check code style
- `npm run lint:fix` - Auto-fix style issues
- `npm test` - Run tests
- `npm test -- --watch` - Watch mode
- `npm test -- --coverage` - Coverage report

### Building
- `npm run prebuild-linux` - Prepare Linux build
- `npm run prebuild-darwin` - Prepare macOS build
- `npm run prebuild-windows` - Prepare Windows build
- `npm run build-linux` - Build Linux AppImage
- `npm run build-darwin` - Build macOS DMG
- `npm run build-windows` - Build Windows installer

### Maintenance
- `npm run init-file-icons` - Initialize file icons submodule
- `npm run update-file-icons` - Update file icon definitions

## Code Style

### JavaScript

Use the provided ESLint configuration:

```javascript
// ✓ Good
const getUserData = async () => {
  try {
    const data = await fetchUser();
    return data;
  } catch (error) {
    logger.error("Failed to fetch user", { error: error.message });
    throw error;
  }
};

// ✗ Bad
const getUserData = async () => {
  let data = await fetchUser();
  return data;
};
```

### Comments & Documentation

```javascript
/**
 * Brief description
 * @param {type} paramName - Parameter description
 * @returns {type} Return description
 * @throws {Error} Exception description
 */
function myFunction(paramName) {
  // Implementation
}
```

### Imports

Keep imports organized:

```javascript
// 1. Built-in modules
const fs = require("fs");
const path = require("path");

// 2. External dependencies
const electron = require("electron");
const Logger = require("electron");

// 3. Internal modules
const { AppError } = require("../utils/errorHandler");
const Terminal = require("../classes/terminal.class.js");
```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- Logger.test.js

# Watch mode (re-run on file changes)
npm test -- --watch

# Coverage report
npm test -- --coverage

# Update snapshots
npm test -- -u
```

### Writing Tests

```javascript
describe("Module Name", () => {
  beforeEach(() => {
    // Setup before each test
  });

  afterEach(() => {
    // Cleanup after each test
    jest.clearAllMocks();
  });

  test("should do something", () => {
    const result = someFunction();
    expect(result).toBe(expected);
  });

  test("should handle errors", async () => {
    await expect(asyncFunction()).rejects.toThrow();
  });
});
```

## Git Workflow

### Commit Messages

Follow Conventional Commits:

```
type(scope): subject

body

Closes #123
```

**Types**: feat, fix, docs, style, refactor, perf, test, chore, ci, revert

**Example**:
```
feat(terminal): add color filter support

Implemented custom color filters for terminal display.
Users can now apply color transformations to match their
theme preferences.

- Added color filter validation
- Added filter expression parser
- Updated terminal styling logic

Closes #456
```

### Pull Requests

1. Describe what changes you made
2. Link related issues (`Closes #123`)
3. Ensure CI passes
4. Request review from maintainers

## Debugging

### Enable Debug Logging

```bash
LOG_LEVEL=debug npm start
```

### Open DevTools

Press `Ctrl+Shift+I` (or enable `DEV_DEBUG` shortcut)

### Debug Specific Module

```javascript
const logger = new Logger("myModule");
logger.debug("Detailed info", { variable: value });
```

## Contributing

### Before Starting Work
- Check [Issues](https://github.com/GitSquared/edex-ui/issues) for existing work
- Comment to claim an issue
- Create draft PR early for visibility

### Code Review Checklist
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No console errors/warnings
- [ ] ESLint passes
- [ ] TypeScript types are correct
- [ ] Commit messages are conventional

### After Merge
- Feature branch is automatically deleted
- Watch CI/CD for deployment

## Troubleshooting

### Dependencies won't install

```bash
# Clean reinstall
rm -rf node_modules src/node_modules package-lock.json
npm ci && cd src && npm ci && cd ..
```

### Tests keep failing

```bash
# Check Jest cache
npm test -- --clearCache

# Check Node version
node --version  # Should be 18.17.0
nvm use
```

### Build fails

```bash
# Check TypeScript
npx tsc --noEmit

# Check linting
npm run lint

# Rebuild native modules
npm run install-linux  # or install-windows or install-darwin
```

### Git hooks not running

```bash
# Reinstall husky
npm install husky --save-dev
npx husky install
```

## Performance Tips

### Optimize builds
- Use `npm ci` instead of `npm install`
- Cache `node_modules` in CI/CD
- Use `--frozen-lockfile` in production

### Optimize runtime
- Use Logger at appropriate levels
- Profile with `console.time()`
- Use Chrome DevTools Performance tab

### Memory management
- Clean up event listeners
- Use `safeCall` for external operations
- Monitor with Node's Memory Inspector

## Resources

- [eDEX-UI README](./README.md)
- [Enhancements Documentation](./ENHANCEMENTS.md)
- [Electron Documentation](https://www.electronjs.org/docs)
- [Jest Documentation](https://jestjs.io/)
- [ESLint Rules](https://eslint.org/docs/rules)
- [Conventional Commits](https://www.conventionalcommits.org/)

## Getting Help

- Open a [GitHub Issue](https://github.com/GitSquared/edex-ui/issues)
- Check existing issues and documentation
- Use clear, descriptive titles
- Include reproduction steps for bugs
