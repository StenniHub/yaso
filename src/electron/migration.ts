import { actionsById } from "@/common/actions";
import { clone } from "@/common/utils";
import * as fileUtils from "./utils/fileutils";
import { version } from "@/../package.json";

export function applyMigrations(): void {
  const session = fileUtils.readConfig("session");
  if (session.version === version) return;

  if (session.version == null) {
    migrate_1_1_1();
    session.version = "1.1.1";
  }

  const parsedVersion = parseVersion(session.version);

  if (parsedVersion < 122) {
    session.useProfiles = true;
  }

  if (parsedVersion < 150) {
    session.timer = {
      soundFile: null
    }
  }

  if (parsedVersion < 151) {
    session.alwaysOnTop = {
      enabled: session.alwaysOnTop,
      opacity: 0.8
    }
  }

  session.version = version;
  fileUtils.saveConfig("session", session);
}

function parseVersion(versionString: string): number {
  const numbers: number[] = versionString.split(".").map(Number);
  return numbers.reduce((a, b, idx) => a + 10 ** (2 - idx) * b, 0);
}

function migrate_1_1_1(): void {
  addEldenRing();
  migrateKeybindsToList();
}

function addEldenRing(): void {
  const games = fileUtils.readConfig("games");
  if (games.er != null) return;

  const baseGames = fileUtils.readBaseConfig("games");
  games.er = baseGames.er;
  fileUtils.saveConfig("games", games);
}

function migrateKeybindsToList(): void {
  const keybinds = fileUtils.readConfig("keybinds");

  // Skip migration if format is already correct
  if (keybinds.length) return;

  const keybindList = [];
  Object.entries(keybinds).forEach(async ([action, keybind]) => {
    // Converts from string format to object format
    if (keybind == null || typeof(keybind) == "string") {
      keybind = { "keys": keybind };
      const actionConfig = actionsById[action].config;
      if (actionConfig) keybind["config"] = clone(actionConfig);
      keybinds[action] = keybind;
    }

    // Converts from object format to list format
    if (action.includes("openFile")) action = "openFile";
    keybind["action"] = action;
    keybindList.push(keybind);
  });

  fileUtils.saveConfig("keybinds", keybindList);
}
