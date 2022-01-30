import { actionsById } from "@/common/actions";
import { clone } from "@/common/utils";

export function migrateKeybindFormat(keybinds: any): Array<unknown> {
  if (keybinds.length) return keybinds;  // Return if already in list format

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

  return keybindList;
}