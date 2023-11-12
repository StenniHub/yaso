"use strict";

import * as fileUtils from "./fileutils";
import { window } from "../window";
import { GlobalKeyboardListener } from 'node-global-key-listener';
import { globalShortcut } from "electron";
import Path from "path";

const isProduction = process.env.NODE_ENV === "production";
const isWindows = process.platform === "win32";
const windowsOptions = isProduction ? { serverPath: Path.join(__dirname, "node_modules/node-global-key-listener/bin/WinKeyServer.exe") } : {};
const modifiers = ["Meta", "META", "Control", "CTRL", "Alt", "ALT", "Shift", "SHIFT"];
const separator = " + ";
const boundKeys = {};
let keyListener = null;

const actions = {
  loadSavefile: () => fileUtils.loadSavefile(),
  selectNext: () => window.webContents.send("selectNext"),
  selectPrevious: () => window.webContents.send("selectPrevious"),
  toggleFolder: () => window.webContents.send("toggleFolder"),
  toggleAlwaysOnTop: () => window.webContents.send("toggleAlwaysOnTop"),
  toggleReadOnly: () => fileUtils.toggleReadOnly(),
  openFile: (config) => fileUtils.openFile(config.filePath),
  playSound: (config) => fileUtils.playSound(config.filePath),
  startTimer: () => window.webContents.send("startTimer"),
  pauseTimer: () => window.webContents.send("pauseTimer"),
  stopTimer: () => window.webContents.send("stopTimer"),
  muteTimer: () => window.webContents.send("muteTimer"),
  disableTimer: () => window.webContents.send("disableTimer")
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

// TODO: Untested, make sure keys are sorted
function keybindHandler(event, down) {
  if (event.state !== "DOWN") return;

  const keys = getKeys(event, down);
  if (keys == null) return;

  if (boundKeys[keys] != null) boundKeys[keys]();
}

// Electron globalShortcut does not work during exclusive fullscreen in windows, using node-global-key-listener instead
export function initKeyListener(): void {
  if (!isWindows) return;
  keyListener = new GlobalKeyboardListener({ windows: windowsOptions });
  keyListener.addListener(keybindHandler);
}

function convertToKeyListener(keys: string) {
  keys = keys.toUpperCase();
  keys = keys.replace("ARROWDOWN", "DOWN ARROW");
  keys = keys.replace("ARROWUP", "UP ARROW");
  keys = keys.replace("ENTER", "RETURN");
  keys = keys.replace("INSERT", "INS");
  return keys;
}

function convertToGlobalShortcut(keys: string) {
  return keys.replaceAll(" ", "").replaceAll("Arrow", "");
}

export function unbind(keys: string): void {
  if (keys == null) return;

  if (keyListener != null) {
    keys = convertToKeyListener(keys);
  } else {
    keys = convertToGlobalShortcut(keys);
    globalShortcut.unregister(keys);
  }
  
  delete boundKeys[keys];
  console.log("Unregistered: ", keys);
}

export function bind(keybind: Record<string, any>): boolean {
  let keys = keybind.keys;
  // window.webContents.send("message", { message: "Could not register keybind: " + keys, success: false });
  // return false;

  const actionFunc = actions[keybind.action];
  if (keyListener != null) {
    keys = convertToKeyListener(keys);
  } else {
    keys = convertToGlobalShortcut(keys);
    globalShortcut.register(keys, () => actionFunc(keybind.config));
  }

  if (boundKeys[keys] != null) unbind(keys);  // Collision detection is handled by renderer
  boundKeys[keys] = () => actionFunc(keybind.config);

  console.log("Registered: ", keys);
  return true;
}
