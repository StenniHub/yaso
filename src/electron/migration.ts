import { actionsById } from "@/common/actions";
import { clone } from "@/common/utils";
import * as fileUtils from "./utils/fileutils";

export function applyMigrations(): void {
  const session = fileUtils.readConfig("session");
  if (session.version == null) {
    migrate_1_1_1(session);
  }
}

function migrate_1_1_1(session): void {
  session.version = "1.1.1";
  addEldenRing();
  migrateKeybindsToList();
  fileUtils.saveConfig("session", session);
}

function addEldenRing(): void {
  const games = fileUtils.readConfig("games");
  if (games.er != null) return;
  
  games.er = {
    "title": "Elden Ring",
    "selected": {
      "folder": null,
      "file": null
    },
    "savefile": null,
    "backups": null,
    "img": "er.jpg"
  }

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
