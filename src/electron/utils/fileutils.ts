import fs from "fs";
import path from "path";
import { dialog, shell } from "electron";
import { homedir } from "os";
import { FileObject } from "@/common/files";
import trash from "trash";
import { exec } from "child_process";
import { sendSuccessMessage, sendErrorMessage } from "./messageUtils";

declare const __static: string;

const basePath = path.join(homedir(), "Documents", "YASO");
const configPath = path.join(basePath, "config");
const imagesPath = path.join(basePath, "images");

const notExists = (file: string) => !fs.existsSync(file);

function onFileCopy(error: Error) {
  if (error != null) {
    sendErrorMessage("Error loading savefile");
  } else {
    sendSuccessMessage("Savefile loaded");
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

function getSelectedGame() {
  const games = readConfig("games");
  const session = readConfig("session");
  return games[session.game];
}

export function loadSavefile(): void {
  const game = getSelectedGame();

  if (isWritable(game.savefile)) {
    copyFile(game.selected.folder + "\\" + game.selected.file, game.savefile);
  } else {
    sendErrorMessage("Savefile is read only");
  }
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

function isWritable(filePath: string) {
  try {
    if (!fs.existsSync(filePath)) return true;

    fs.accessSync(filePath, fs.constants.W_OK);
    return true;
  } catch (error) {
    return false;
  }
}

export function toggleReadOnly(): void {
  const game = getSelectedGame();

  if (isWritable(game.savefile)) {
    exec('attrib +r "' + game.savefile + '"');
    sendSuccessMessage("Read only enabled");
  } else {
    exec('attrib -r "' + game.savefile + '"');
    sendSuccessMessage("Read only disabled");
  }
}

export function openFile(filePath: string): void {
  shell.openPath(filePath);
}
