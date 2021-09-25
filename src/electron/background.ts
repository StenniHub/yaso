"use strict";

import { app, protocol, Menu, MenuItem, ipcMain } from "electron";
import installExtension, { VUEJS_DEVTOOLS } from "electron-devtools-installer";
import { window, createWindow } from "./window"
import * as keyUtils from "./utils/keyutils"
import * as fileUtils from "./utils/fileutils"
import iohook from "iohook";  // Note: iohook requires Visual C++ Redistributable

const isDevelopment = process.env.NODE_ENV !== "production";

const menu = new Menu();
Menu.setApplicationMenu(menu);

if (isDevelopment) {
  menu.append(new MenuItem({
    label: "HACKERMAN",
    accelerator: "F12",
    role: "toggleDevTools"
  }));
}

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: "app", privileges: { secure: true, standard: true } }
]);

// Quit when all windows are closed.
app.on("window-all-closed", () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (window === null) {
    createWindow();
  }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    try {
      await installExtension(VUEJS_DEVTOOLS);
    } catch (e) {
      console.error("Vue Devtools failed to install:", e.toString());
    }
  }

  createWindow();
  iohook.start(false);
  fileUtils.initFolders();
});


// Begin IPC handlers
ipcMain.handle("readDir", (event: Event, path: string) => fileUtils.readDir(path));
ipcMain.handle("readImage", (event: Event, file: string) => fileUtils.readImage(file));
ipcMain.handle("createFolder", (event: Event, path: string) => fileUtils.createFolder(path));
ipcMain.handle("copyFile", (event: Event, from: string, to:string) => fileUtils.copyFile(from, to));

ipcMain.handle("readConfig", (event: Event, filename: string) => fileUtils.readConfig(filename));
ipcMain.handle("saveConfig", (event: Event, filename: string, content: Record<string, any>) => {
  fileUtils.saveConfig(filename, content);
});

ipcMain.handle("awaitKeys", (event: Event) => keyUtils.awaitKeys());
ipcMain.handle("unbindKeys", (event: Event, keys: string) => keyUtils.unbind(keys));
ipcMain.handle("bindKeys", (event: Event, action: string, keys: string) => keyUtils.bind(action, keys));

ipcMain.handle("selectFile", (event: Event, path: string) => fileUtils.selectFile(path));
ipcMain.handle("selectFolder", (event: Event, path: string) => fileUtils.selectFolder(path));
ipcMain.handle("loadSavefile", (event: Event) => fileUtils.loadSavefile());
ipcMain.handle("revealInExplorer", (event: Event, path: string) => fileUtils.revealInExplorer(path));

ipcMain.handle("rename", (event: Event, fromPath: string, toPath: string) => fileUtils.rename(fromPath, toPath));
ipcMain.handle("remove", (event: Event, path: string) => fileUtils.remove(path));
ipcMain.handle("refreshSelected", (event: Event) => window.webContents.send("refreshSelected"));

ipcMain.handle("minimizeWindow", (event: Event) => window.minimize());
ipcMain.handle("closeWindow", (event: Event) => window.close());
ipcMain.handle("alwaysOnTop", (event: Event, enabled: boolean) => {
  window.setAlwaysOnTop(enabled, "pop-up-menu");
  window.setOpacity(enabled ? 0.8 : 1.0);  // TODO: Make opacity user configurable
});
// End IPC handlers

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === "win32") {
    process.on("message", data => {
      if (data === "graceful-exit") {
        app.quit();
      }
    });
  } else {
    process.on("SIGTERM", () => {
      app.quit();
    });
  }
}
