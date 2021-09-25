import fs from "fs";
import path from "path";
import { window } from "../window";
import { dialog } from "electron";
import { homedir } from "os";
import { FileObject } from "@/common/files";
import trash from "trash";
import { exec } from "child_process";

declare const __static: string;

const basePath = path.join(homedir(), "Documents", "YASO");
const configPath = path.join(basePath, "config");
const imagesPath = path.join(basePath, "images");

const notExists = (file: string) => !fs.existsSync(file);

function onFileCopy(error: Error) {
  if (error != null) {
    window.webContents.send("message", { message: "Error loading savefile", success: false });
  } else {
    window.webContents.send("message", { message: "Savefile loaded", success: true });
  }
}

export function initFolders(): void {
  const folders = [basePath, configPath, imagesPath];
  folders.filter(notExists).forEach(fs.mkdirSync);
}

export function readDir(path: string): FileObject[] {
  const files: FileObject[] = [];

  fs.readdirSync(path, { withFileTypes: true }).forEach(file => {
    const filePath = path + "\\" + file.name;
    files.push(new FileObject(file.name, filePath, file.isDirectory()));
  })

  return files;
}

export function readConfig(filename: string): Record<string, any> {
  const filePath = path.join(configPath, filename + ".json");
  
  if (notExists(filePath)) {
    fs.copyFileSync(path.join(__static, "config", filename + ".json"), filePath);
  }

  return JSON.parse(fs.readFileSync(filePath, { encoding: "utf-8" }));
}

export function readImage(file: string): string {
  const filePath = path.join(imagesPath, file);
  
  if (notExists(filePath)) {
    fs.copyFileSync(path.join(__static, "images", file), filePath);
  }

  return fs.readFileSync(filePath, {encoding: 'base64'});
}

export function saveConfig(filename: string, content: Record<string, any>): void {
  const filePath = path.join(configPath, filename + ".json");
  fs.writeFileSync(filePath, JSON.stringify(content, null, 4), { encoding: "utf-8" });
}

export function copyFile(from: string, to: string): void {
  fs.copyFile(from, to, onFileCopy);
}

export function selectFile(path: string): Promise<Electron.OpenDialogReturnValue> {
  return dialog.showOpenDialog({ defaultPath: path || undefined, properties: ["openFile"] });
}

export function selectFolder(path: string): Promise<Electron.OpenDialogReturnValue> {
  return dialog.showOpenDialog({ defaultPath: path || undefined, properties: ["openDirectory"] });
}

export function loadSavefile(): void {
  const games = readConfig("games");
  const session = readConfig("session");
  const game = games[session.game];
  copyFile(game.selected.folder + "\\" + game.selected.file, game.savefile);
}

export function createFolder(path: string): void {
  fs.mkdirSync(path);
}

export function rename(fromPath: string, toPath: string): void {
  fs.renameSync(fromPath, toPath);
}

export function remove(path: string): Promise<void> {
  return trash(path);
}

export function revealInExplorer(path: string): void {
  exec('explorer /select,"' + path + '"');
}
