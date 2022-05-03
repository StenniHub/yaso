"use strict";

import * as fileUtils from "./fileutils";
import { window } from "../window";
import { GlobalKeyboardListener } from 'node-global-key-listener';
import Path from "path";

// Electron globalShortcut does not work during exclusive fullscreen, using node-global-key-listener instead

const isDevelopment = process.env.NODE_ENV !== "production";
let serverPath = Path.join(process.resourcesPath, "WinKeyServer.exe");
if (isDevelopment) {
  serverPath = "node_modules/node-global-key-listener/bin/WinKeyServer.exe";
}

const keyListener = new GlobalKeyboardListener({ windows: { serverPath: serverPath }});
const modifiers = ["META", "CTRL", "ALT", "SHIFT"];
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

function getKeys(event, down): string {
  let keys = "";
  for (const modifier of modifiers) {
    const leftModifier = "LEFT " + modifier;
    const rightModifier = "RIGHT " + modifier;

    if (event.name === leftModifier || event.name === rightModifier) return null;  // Only modifiers are pressed
    
    if (down[leftModifier]) keys += leftModifier + separator;
    if (down[rightModifier]) keys += rightModifier + separator;
  }

  keys += event.name;
  return keys;
}

function keybindHandler(event, down) {
  if (event.state !== "DOWN") return;

  const keys = getKeys(event, down);
  if (keys == null) return;

  if (boundKeys[keys] != null) boundKeys[keys]();
}

export function initKeyListener(): void {
  keyListener.addListener(keybindHandler);
}

export function awaitKeys(): Promise<string> {
  keyListener.removeListener(keybindHandler);

  return new Promise((resolve, reject) => {
    const keyHandler = (event, down) => {
      if (event.state !== "UP") return;

      let keys = getKeys(event, down);
      if (keys == null) return;

      keyListener.addListener(keybindHandler);
      keyListener.removeListener(keyHandler);

      if (keys === "ESCAPE") {
        reject("Cancelled by user");
      }

      // Replace some key names for better readability
      keys = keys.replace("RETURN", "ENTER");
      keys = keys.replace("INS", "INSERT");
      resolve(keys);
    };

    keyListener.addListener(keyHandler);
  });
}

export function unbind(keys: string): void {
  delete boundKeys[keys];
  console.log("Unregistered: ", keys);
}

export function bind(keybind: Record<string, any>): boolean {
  let keys = keybind["keys"];
  const action = keybind["action"];

  // TODO: Convert to globalShortcut format and check if keys are already registered first
  // window.webContents.send("message", { message: "Could not register keybind: " + keys, success: false });
  // return false;

  // Converts old key format to compatible ones (TODO: move to migration script)
  keys = keys.toUpperCase();
  keys = keys.replace("ARROW DOWN", "DOWN ARROW");
  keys = keys.replace("ARROW UP", "UP ARROW");
  keys = keys.replace("ENTER", "RETURN");
  keys = keys.replace("INSERT", "INS");

  if (boundKeys[keys] != null) {
    unbind(keys);  // Collision detection is handled by renderer
  }

  let actionFunc
  if (action.includes("openFile")) actionFunc = () => fileUtils.openFile(keybind.config.filePath);
  else actionFunc = actions[action];

  boundKeys[keys] = actionFunc;
  console.log("Registered: ", keys);
  return true;
}
