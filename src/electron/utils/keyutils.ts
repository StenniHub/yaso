"use strict";

import * as fileUtils from "./fileutils";
import { window } from "../window";
import {keycodes, reverseKeycodes} from "./keycodes";
import iohook from "iohook";

// Electron globalShortcut does not work during exclusive fullscreen, using iohook instead
// Make sure binary exists for electron version before updating

const separator = " + ";
const boundKeys = {};

const actions = {
  loadSavefile: fileUtils.loadSavefile,
  selectNext: () => window.webContents.send("selectNext"),
  selectPrevious: () => window.webContents.send("selectPrevious"),
  toggleFolder: () => window.webContents.send("toggleFolder"),
  toggleAlwaysOnTop: () => window.webContents.send("toggleAlwaysOnTop"),
  toggleReadOnly: fileUtils.toggleReadOnly
};

export function awaitKeys(): Promise<string> {
  return new Promise((resolve, reject) => {
    iohook.once("keyup", input => {
      if (input.keycode === 1) {  // Escape
        reject("Cancelled by user");
      } else {
        let modifiers = "";
        if (input.ctrlKey) modifiers += keycodes[29] + separator;
        if (input.altKey) modifiers += keycodes[56] + separator;
        if (input.shiftKey) modifiers += keycodes[42] + separator;
        if (input.metaKey) modifiers += keycodes[3675] + separator;
        resolve(modifiers + keycodes[input.keycode]);
      }
    });
  });
}

// Unregister does not return a value, but if unregister did not work then register likely did not work either
export function unbind(keys: string): void {
  iohook.unregisterShortcut(boundKeys[keys]);
  delete boundKeys[keys];
  console.log("Unregistered: ", keys);
}

export function bind(keybind: Record<string, any>): boolean {
  const keys = keybind["keys"];
  const action = keybind["action"];

  if (boundKeys[keys] != null) {
    unbind(keys);  // Collision detection is handled by Vue now
  }

  const keyList = keys.split(separator).map(name => reverseKeycodes[name]);
  let registered = false;

  try {
    let actionFunc
    if (action.includes("openFile")) actionFunc = () => fileUtils.openFile(keybind.config.filePath);
    else actionFunc = actions[action];
    
    const id = iohook.registerShortcut(keyList, actionFunc);

    if (id != null) {
      registered = true;
      boundKeys[keys] = id;
      console.log("Registered: ", keys);
    } else {
      window.webContents.send("message", { message: "Keybind already registered: " + keyList, success: false });
    }
  } catch (e) {
    console.log(e);
    window.webContents.send("message", { message: "Could not register keybind: " + keyList, success: false });
  }

  return registered;
}
