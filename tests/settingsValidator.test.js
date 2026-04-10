/**
 * Tests for settingsValidator utility
 */

const {
  validateSettings,
  getDefaultSettings,
  migrateSettings,
  SettingsSchema
} = require("../src/utils/settingsValidator");

describe("Settings Validator", () => {
  describe("getDefaultSettings", () => {
    test("should return valid default settings", () => {
      const defaults = getDefaultSettings();
      expect(defaults).toHaveProperty("shell");
      expect(defaults).toHaveProperty("theme");
      expect(defaults).toHaveProperty("termFontSize");
      expect(defaults._meta).toHaveProperty("version");
    });

    test("defaults should pass validation", () => {
      const defaults = getDefaultSettings();
      expect(() => validateSettings(defaults)).not.toThrow();
    });
  });

  describe("validateSettings", () => {
    test("should validate correct settings", () => {
      const settings = {
        shell: "bash",
        theme: "tron",
        termFontSize: 15,
        audio: true,
        audioVolume: 0.8,
        clockHours: 24,
        pingAddr: "8.8.8.8",
        port: 3000
      };

      expect(() => validateSettings(settings)).not.toThrow();
    });

    test("should reject invalid font size", () => {
      const settings = getDefaultSettings();
      settings.termFontSize = 100; // Too large
      expect(() => validateSettings(settings)).toThrow();
    });

    test("should reject invalid port", () => {
      const settings = getDefaultSettings();
      settings.port = 500; // Too low
      expect(() => validateSettings(settings)).toThrow();
    });

    test("should reject invalid audio volume", () => {
      const settings = getDefaultSettings();
      settings.audioVolume = 1.5; // Should be 0-1
      expect(() => validateSettings(settings)).toThrow();
    });

    test("should accept 12 or 24 hour clock", () => {
      const settings = getDefaultSettings();
      settings.clockHours = 12;
      expect(() => validateSettings(settings)).not.toThrow();

      settings.clockHours = 24;
      expect(() => validateSettings(settings)).not.toThrow();
    });
  });

  describe("migrateSettings", () => {
    test("should migrate from version 1", () => {
      const oldSettings = getDefaultSettings();
      const migrated = migrateSettings(oldSettings, 1);
      expect(migrated._meta.version).toBe(1);
      expect(migrated._meta.lastMigrated).toBeDefined();
    });

    test("should preserve settings during migration", () => {
      const original = getDefaultSettings();
      const migrated = migrateSettings(original, 1);
      expect(migrated.shell).toBe(original.shell);
      expect(migrated.theme).toBe(original.theme);
    });
  });
});
