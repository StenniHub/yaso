"use strict";

import { BrowserWindow, shell } from "electron";
import { createProtocol } from "vue-cli-plugin-electron-builder/lib";
import path from "path";

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
export let window: BrowserWindow | null;

export function createWindow(): BrowserWindow {
  // Create the browser window.
  window = new BrowserWindow({
    width: 450,
    height: 600,
    frame: false,
    fullscreenable: false,
    webPreferences: {
      // Use pluginOptions.nodeIntegration, leave this alone
      // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
      nodeIntegration: (process.env.ELECTRON_NODE_INTEGRATION as unknown) as boolean,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js'),
      backgroundThrottling: false
    }
  });
  
  window.menuBarVisible = false;

  window.webContents.on('new-window', function(e, url) {
    e.preventDefault();
    shell.openExternal(url);
  });
  
  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    window.loadURL(process.env.WEBPACK_DEV_SERVER_URL as string);
    //if (!process.env.IS_TEST) window.webContents.openDevTools();
  } else {
    createProtocol("app");
    // Load the index.html when not in development
    window.loadURL("app://./index.html");
  }
  
  window.on("closed", () => {
    window = null;
  });

  return window;
}
