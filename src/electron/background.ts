"use strict";

import { app, protocol, Menu, MenuItem, ipcMain, IpcMainInvokeEvent } from "electron";
import installExtension, { VUEJS_DEVTOOLS } from "electron-devtools-installer";
import { window, createWindow } from "./window";
import * as keyUtils from "./utils/keyutils";
import * as fileUtils from "./utils/fileutils";
import * as messageUtils from "./utils/messageUtils";
import { applyMigrations } from "./migration";

const isDevelopment = process.env.NODE_ENV !== "production";
initApp();

function initApp(): void {
  // Make sure only one window can exist at a time
  if (!app.requestSingleInstanceLock()) {
    app.quit();
    return;
  }

  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Attempted to open a second instance, focuse this window instead.
    if (window == null) return;
    if (window.isMinimized()) window.restore();
    window.focus();
  })

  const menu = new Menu();
  Menu.setApplicationMenu(menu);

  if (isDevelopment) {
    menu.append(new MenuItem({
      label: "HACKERMAN",
      accelerator: "F12",
      role: "toggleDevTools"
    }));

    
    // Exit cleanly on request from parent process in development mode.
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

    fileUtils.initFolders();
    applyMigrations();
    
    createWindow();
    keyUtils.initKeyListener();
    if (process.platform === "win32") {
      // Not yet supported on linux
      fileUtils.initSoundProcess();
    }

    // Resize window
    const session = fileUtils.readConfig("session");
    if (session && session.windowSize) {
      const sizes = session.windowSize.split("x");
      const width = parseInt(sizes[0]);
      const height = parseInt(sizes[1]);
      window.setSize(width, height);
    }

    // Activate all hotkeys
    const keybinds = fileUtils.readConfig("keybinds");
    keybinds.forEach(async keybind => {
      if (keybind["keys"] != null) keyUtils.bind(keybind);
    })

    window.on('resize', function () {
      const size = window.getSize();
      messageUtils.saveWindowSize(size[0], size[1]);
    });
  });


  // Begin IPC handlers
  ipcMain.handle("readDir", (event: IpcMainInvokeEvent, path: string) => fileUtils.readDir(path));
  ipcMain.handle("readImage", (event: IpcMainInvokeEvent, file: string) => fileUtils.readImage(file));
  ipcMain.handle("createFolder", (event: IpcMainInvokeEvent, path: string) => fileUtils.createFolder(path));
  ipcMain.handle("copyFile", (event: IpcMainInvokeEvent, from: string, to:string) => fileUtils.copyFile(from, to));

  ipcMain.handle("readConfig", (event: IpcMainInvokeEvent, filename: string) => fileUtils.readConfig(filename));
  ipcMain.handle("saveConfig", (event: IpcMainInvokeEvent, filename: string, content: Record<string, unknown>) => fileUtils.saveConfig(filename, content));

  ipcMain.handle("unbindKeys", (event: IpcMainInvokeEvent, keys: string) => keyUtils.unbind(keys));
  ipcMain.handle("bindKeys", (event: IpcMainInvokeEvent, keybind: Record<string, unknown>) => keyUtils.bind(keybind));

  ipcMain.handle("successMsg", (event: IpcMainInvokeEvent, message: string) => messageUtils.sendSuccessMessage(message));
  ipcMain.handle("errorMsg", (event: IpcMainInvokeEvent, message: string) => messageUtils.sendErrorMessage(message));

  ipcMain.handle("selectFile", (event: IpcMainInvokeEvent, path: string) => fileUtils.selectFile(path));
  ipcMain.handle("selectFolder", (event: IpcMainInvokeEvent, path: string) => fileUtils.selectFolder(path));
  ipcMain.handle("loadSavefile", () => fileUtils.loadSavefile());
  ipcMain.handle("toggleReadOnly", () => fileUtils.toggleReadOnly());
  ipcMain.handle("revealInExplorer", (event: IpcMainInvokeEvent, path: string) => fileUtils.revealInExplorer(path));

  ipcMain.handle("playSound", (event: IpcMainInvokeEvent, filePath: string) => fileUtils.playSound(filePath));
  ipcMain.handle("stopSound", () => fileUtils.stopSound());

  ipcMain.handle("move", (event: IpcMainInvokeEvent, fromPath: string, toPath: string) => fileUtils.rename(fromPath, toPath));
  ipcMain.handle("remove", (event: IpcMainInvokeEvent, path: string) => fileUtils.remove(path));

  ipcMain.handle("minimizeWindow", () => window.minimize());
  ipcMain.handle("closeWindow", () => window.close());
  ipcMain.handle("alwaysOnTop", (event: IpcMainInvokeEvent, enabled: boolean) => {
    window.setAlwaysOnTop(enabled, "pop-up-menu");
    window.setOpacity(enabled ? 0.8 : 1.0);  // TODO: Make opacity user configurable
  });
  // End IPC handlers
}
