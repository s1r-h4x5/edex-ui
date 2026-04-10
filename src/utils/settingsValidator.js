/**
 * Settings validation and migration schema for eDEX-UI
 * Uses Zod for runtime type validation
 */

const { z } = require("zod");

/**
 * Settings schema definition
 * Validates the structure of settings.json
 */
const SettingsSchema = z.object({
  // Shell settings
  shell: z.string().default("bash").describe("Shell executable to use"),
  shellArgs: z.string().default("").describe("Shell arguments"),
  cwd: z.string().default("").describe("Current working directory"),

  // UI settings
  keyboard: z.string().default("en-US").describe("Keyboard layout"),
  theme: z.string().default("tron").describe("Theme name"),
  termFontSize: z.number().int().min(8).max(72).default(15).describe("Terminal font size"),

  // Audio settings
  audio: z.boolean().default(true).describe("Enable audio"),
  audioVolume: z.number().min(0).max(1).default(1.0).describe("Audio volume (0-1)"),
  disableFeedbackAudio: z.boolean().default(false).describe("Disable feedback audio"),

  // Clock settings
  clockHours: z.enum(["12", "24"]).or(z.number().int().refine(n => n === 12 || n === 24)).default(24).describe("Clock format (12 or 24 hours)"),

  // Network settings
  pingAddr: z.string().ip().default("1.1.1.1").describe("Address to ping for connectivity check"),
  port: z.number().int().min(1024).max(65535).default(3000).describe("WebSocket server port"),

  // Display settings
  nointro: z.boolean().default(false).describe("Skip intro sequence"),
  nocursor: z.boolean().default(false).describe("Hide cursor"),
  forceFullscreen: z.boolean().default(true).describe("Force fullscreen mode"),
  allowWindowed: z.boolean().default(false).describe("Allow windowed mode"),

  // Content settings
  excludeThreadsFromToplist: z.boolean().default(true).describe("Exclude threads from toplist"),
  hideDotfiles: z.boolean().default(false).describe("Hide dotfiles in file browser"),
  fsListView: z.boolean().default(false).describe("Use list view for file browser"),

  // Experimental features
  experimentalGlobeFeatures: z.boolean().default(false).describe("Enable experimental globe features"),
  experimentalFeatures: z.boolean().default(false).describe("Enable other experimental features")
}).strict().passthrough();

/**
 * Migration schema for version tracking
 */
const MigrationSchema = z.object({
  version: z.number().default(1),
  lastMigrated: z.number().default(Date.now())
});

/**
 * Settings file schema (including migration info)
 */
const SettingsFileSchema = z.object({
  _meta: MigrationSchema.optional(),
  ...SettingsSchema.shape
});

/**
 * Migrations for settings versions
 */
const MIGRATIONS = {
  1: (settings) => settings, // no migration needed for v1
  2: (settings) => {
    // Example: future migration logic
    return settings;
  }
};

/**
 * Current settings version
 */
const CURRENT_VERSION = 1;

/**
 * Validate settings against schema
 * @param {object} settings - Settings object to validate
 * @returns {object} Validated settings
 * @throws {Error} If validation fails
 */
function validateSettings(settings) {
  try {
    return SettingsSchema.parse(settings);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(err =>
        `${err.path.join(".")}: ${err.message}`
      ).join(", ");
      throw new Error(`Settings validation failed: ${messages}`);
    }
    throw error;
  }
}

/**
 * Migrate settings to current version
 * @param {object} settings - Settings object
 * @param {number} fromVersion - Version to migrate from
 * @returns {object} Migrated settings
 */
function migrateSettings(settings, fromVersion = 1) {
  let migrated = { ...settings };

  for (let v = fromVersion; v < CURRENT_VERSION; v++) {
    if (MIGRATIONS[v + 1]) {
      migrated = MIGRATIONS[v + 1](migrated);
    }
  }

  migrated._meta = {
    version: CURRENT_VERSION,
    lastMigrated: Date.now()
  };

  return migrated;
}

/**
 * Get default settings
 * @returns {object} Default settings
 */
function getDefaultSettings() {
  return {
    shell: (process.platform === "win32") ? "powershell.exe" : "bash",
    shellArgs: "",
    cwd: require("electron").app.getPath("userData"),
    keyboard: "en-US",
    theme: "tron",
    termFontSize: 15,
    audio: true,
    audioVolume: 1.0,
    disableFeedbackAudio: false,
    clockHours: 24,
    pingAddr: "1.1.1.1",
    port: 3000,
    nointro: false,
    nocursor: false,
    forceFullscreen: true,
    allowWindowed: false,
    excludeThreadsFromToplist: true,
    hideDotfiles: false,
    fsListView: false,
    experimentalGlobeFeatures: false,
    experimentalFeatures: false,
    _meta: {
      version: CURRENT_VERSION,
      lastMigrated: Date.now()
    }
  };
}

module.exports = {
  SettingsSchema,
  SettingsFileSchema,
  validateSettings,
  migrateSettings,
  getDefaultSettings,
  CURRENT_VERSION
};
