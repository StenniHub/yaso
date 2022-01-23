import { actionsById } from "@/common/actions";

export function migrateKeybindFormat(keybinds: Record<string, unknown>): void {
  Object.entries(keybinds).forEach(async ([action, keybind]) => {
    if (keybind == null || typeof(keybind) == "string") {
      keybind = { "keys": keybind };
      if (actionsById[action].config) keybind["config"] = actionsById[action].config;
      keybinds[action] = keybind;
    }
  });
}