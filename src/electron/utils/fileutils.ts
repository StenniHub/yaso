import fs from "fs";
import path from "path";
import { dialog, shell } from "electron";
import { homedir } from "os";
import { FileObject } from "@/common/files";
import trash from "trash";
import { exec } from "child_process";
import { sendSuccessMessage, sendErrorMessage } from "./messageUtils";

declare const __static: string;

// TODO: Better way to detect if running in portable mode?
const homeDir = homedir();
const portablePath = process.env.PORTABLE_EXECUTABLE_DIR;
const isPortable = portablePath != null;
const basePath = isPortable ? path.join(portablePath, "YASO") : path.join(homeDir, "Documents", "YASO");
const configPath = path.join(basePath, "config");
const imagesPath = path.join(basePath, "images");

export function initFolders(): void {
  const folders = [basePath, configPath, imagesPath];
  folders.filter(notExists).forEach(fs.mkdirSync);
}

export function readDir(path: string): FileObject[] {
  const files: FileObject[] = [];
  path = toAbsolutePath(path);

  fs.readdirSync(path, { withFileTypes: true }).forEach(file => {
    const filePath = path + "\\" + file.name;
    files.push(new FileObject(file.name, filePath, file.isDirectory()));
  })

  return files;
}

export function readBaseConfig(filename: string): Record<string, any> {
  const filePath = path.join(__static, "config", filename + ".json");
  return JSON.parse(fs.readFileSync(filePath, { encoding: "utf-8" }));
}

export function readConfig(filename: string): Record<string, any> {
  const filePath = path.join(configPath, filename + ".json");
  
  if (notExists(filePath)) {
    const config = readBaseConfig(filename);
    saveConfig(filename, config);
    return config;
  }

  return JSON.parse(fs.readFileSync(filePath, { encoding: "utf-8" }));
}

export function saveConfig(filename: string, content: Record<string, any>): void {
  const filePath = path.join(configPath, filename + ".json");
  fs.writeFileSync(filePath, JSON.stringify(content, null, 4), { encoding: "utf-8" });
}

export function readImage(file: string): string {
  const filePath = path.join(imagesPath, file);
  
  if (notExists(filePath)) {
    fs.copyFileSync(path.join(__static, "images", file), filePath);
  }

  return fs.readFileSync(filePath, {encoding: 'base64'});
}

export function copyFile(from: string, to: string): void {
  from = toAbsolutePath(from);
  to = toAbsolutePath(to);
  fs.copyFile(from, to, onFileCopy);
}

export async function selectFile(path: string): Promise<string> {
  return dialog.showOpenDialog({ defaultPath: path || undefined, properties: ["openFile"] }).then(result => {
    if (result.canceled) return null;
    
    const path = result.filePaths[0];
    return toRelativePath(path);
  });
}

export async function selectFolder(path: string): Promise<string> {
  return dialog.showOpenDialog({ defaultPath: path || undefined, properties: ["openDirectory"] }).then(result => {
    if (result.canceled) return null;
    
    const path = result.filePaths[0];
    return toRelativePath(path);
  });
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
  path = toAbsolutePath(path);
  fs.mkdirSync(path);
}

export function rename(fromPath: string, toPath: string): void {
  fromPath = toAbsolutePath(fromPath);
  toPath = toAbsolutePath(toPath);
  fs.renameSync(fromPath, toPath);
}

export function remove(path: string): Promise<void> {
  path = toAbsolutePath(path);
  return trash(path);
}

export function revealInExplorer(path: string): void {
  path = toAbsolutePath(path);
  exec('explorer /select,"' + path + '"');
}

export function openFile(filePath: string): void {
  filePath = toAbsolutePath(filePath);
  shell.openPath(filePath);
}

export function toggleReadOnly(): void {
  const game = getSelectedGame();
  const path = toAbsolutePath(game.savefile);

  if (isWritable(path)) {
    exec('attrib +r "' + path + '"');
    sendSuccessMessage("Read only enabled");
  } else {
    exec('attrib -r "' + path + '"');
    sendSuccessMessage("Read only disabled");
  }
}

function notExists (file: string) {
  file = toAbsolutePath(file);
  return !fs.existsSync(file);
}

function isWritable(filePath: string) {
  try {
    filePath = toAbsolutePath(filePath);
    if (!fs.existsSync(filePath)) return true;
    fs.accessSync(filePath, fs.constants.W_OK);
    return true;
  } catch (error) {
    return false;
  }
}

function onFileCopy(error: Error) {
  if (error != null) {
    sendErrorMessage("Error loading savefile");
  } else {
    sendSuccessMessage("Savefile loaded");
  }
}

// Replaces home path and converts to relative path when possible
function toRelativePath(path: string): string {
  if (path == null) return null;

  if (path.includes(homeDir)) {
    path = path.replace(homeDir, "%userprofile%");
  }

  if (isPortable && path.includes(portablePath)) {
    path = path.replaceAll(portablePath, "");
    if (path === "") return "\\";
  }

  return path;
}

// Converts relative paths used by portable version to absolute paths (in case e.g. drive letter is different)
function toAbsolutePath(path: string) {
  if (path == null) return null;

  if (path.includes("%userprofile%")) {
    path = path.replace("%userprofile%", homeDir);
  }

  if (isPortable && path.startsWith("\\")) {
    path = portablePath + path;
  }

  return path;
}

function getSelectedGame() {
  const games = readConfig("games");
  const session = readConfig("session");
  return games[session.game];
}
