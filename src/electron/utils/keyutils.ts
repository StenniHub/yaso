"use strict";

import * as fileUtils from "./fileutils";
import { window } from "../window";
import { GlobalKeyboardListener } from 'node-global-key-listener';
import Path from "path";
// Electron globalShortcut does not work during exclusive fullscreen, using node-global-key-listener instead
const isProduction = process.env.NODE_ENV === "production";
const windowsOptions = isProduction ? { serverPath: Path.join(__dirname, "node_modules/node-global-key-listener/bin/WinKeyServer.exe") } : {};
const keyListener = new GlobalKeyboardListener({ windows: windowsOptions });
const modifiers = ["META", "CTRL", "ALT", "SHIFT"];
const separator = " + ";
const boundKeys = {};

const actions = {
  loadSavefile: (config) => fileUtils.loadSavefile(),
  selectNext: (config) => window.webContents.send("selectNext"),
  selectPrevious: (config) => window.webContents.send("selectPrevious"),
  toggleFolder: (config) => window.webContents.send("toggleFolder"),
  toggleAlwaysOnTop: (config) => window.webContents.send("toggleAlwaysOnTop"),
  toggleReadOnly: (config) => fileUtils.toggleReadOnly(),
  openFile: (config) => fileUtils.openFile(config.filePath),
  playSound: (config) => fileUtils.playSound(config.filePath),
  startTimer: (config) => startTimer(config.filePath),
  pauseTimer: (config) => window.webContents.send("pauseTimer"),
  stopTimer: (config) => stopTimer(),
  toggleTimer: (config) => toggleTimer()
};

function startTimer(soundFilePath: string): void {
  const config = fileUtils.readConfig("session");
  if (config.timerEnabled) {
    window.webContents.send("startTimer");
    if (soundFilePath != null) fileUtils.playSound(soundFilePath);
  }
}

function stopTimer() {
  window.webContents.send("stopTimer");
  fileUtils.stopSound();
}

// Hacky workaround for now, should improve later
function toggleTimer() {
  const config = fileUtils.readConfig("session");
  config.timerEnabled = !config.timerEnabled;
  fileUtils.saveConfig("session", config);
  window.webContents.send("timerEnabled", { timerEnabled: config.timerEnabled });
}

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
  let keys = keybind.keys;
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

  const actionFunc = actions[keybind.action];
  boundKeys[keys] = () => actionFunc(keybind.config);
  console.log("Registered: ", keys);
  return true;
}
