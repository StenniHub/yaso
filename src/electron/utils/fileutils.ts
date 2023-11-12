import fs from "fs";
import path from "path";
import { dialog, shell } from "electron";
import { homedir } from "os";
import { FileObject } from "@/common/files";
import trash from "trash";
import { exec, spawn } from "child_process";
import { sendSuccessMessage, sendErrorMessage } from "./messageUtils";

declare const __static: string;

// TODO: Better way to detect if running in portable mode?
const homeDir = homedir();
const portablePath = process.env.PORTABLE_EXECUTABLE_DIR;
const isPortable = portablePath != null;
const isWindows = process.platform === "win32";
const sep = isWindows ? "\\" : "/";  // TODO: Just use path.join consistently in here
const basePath = getBasePath();
const configPath = path.join(basePath, "config");
const imagesPath = path.join(basePath, "images");

const useSeparateWavPlayer = false;

let soundProcess = null;
let activeSoundFile = null;

function getBasePath() {
  if (isPortable) return path.join(portablePath, "YASO");
  if (isWindows) return path.join(homeDir, "Documents", "YASO");
  return path.join(homeDir, "YASO");
}

export function initFolders(): void {
  const folders = [basePath, configPath, imagesPath];
  folders.filter(notExists).forEach(mkdir);
}

function mkdir(path: string): void {
  fs.mkdirSync(path, 0o777);
}

export function readDir(path: string): FileObject[] {
  const files: FileObject[] = [];
  path = toAbsolutePath(path);

  fs.readdirSync(path, { withFileTypes: true }).forEach(file => {
    const filePath = path + sep + file.name;
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

  return readFileBase64(filePath);
}

function readFileBase64(path: string) {
  const filePath = toAbsolutePath(path);
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
    copyFile(game.selected.folder + sep + game.selected.file, game.savefile);
  } else {
    sendErrorMessage("Savefile is read only");
  }
}

export function createFolder(path: string): void {
  path = toAbsolutePath(path);
  mkdir(path);
}

export function rename(fromPath: string, toPath: string): void {
  fromPath = toAbsolutePath(fromPath);
  toPath = toAbsolutePath(toPath);
  fs.renameSync(fromPath, toPath);
}

export async function remove(path: string): Promise<void> {
  path = toAbsolutePath(path);

  if (isPortable && !path.startsWith("C:\\")) {
    fs.rmSync(path, { recursive: true });  // Trash does not seem to work on a USB stick
    return;
  }

  await trash(path);
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
    path = path.replace(portablePath, "");
    if (path === "") return sep;
  }

  return path;
}

// Converts relative paths used by portable version to absolute paths (in case e.g. drive letter is different)
function toAbsolutePath(path: string) {
  if (path == null) return null;

  if (path.includes("%userprofile%")) {
    path = path.replace("%userprofile%", homeDir);
  }

  if (isPortable && path.startsWith(sep)) {
    path = portablePath + path;
  }

  return path;
}

function getSelectedGame() {
  const games = readConfig("games");
  const session = readConfig("session");
  return games[session.game];
}

export function initSoundProcess() {
  soundProcess = spawn("powershell.exe");

  soundProcess.stderr.on("data", function(data) {
    console.log("Sound Process: " + data);
  });
  
  soundProcess.stdin.write('Add-Type -AssemblyName presentationCore\n');
  soundProcess.stdin.write('$PLAYER = New-Object system.windows.media.mediaplayer\n');
  if (useSeparateWavPlayer) {
    soundProcess.stdin.write('$WAV_PLAYER = New-Object Media.SoundPlayer\n');  // Might be slightly faster for WAV files, but increases memory consumption
  }
}

function playSoundProcess(filePath: string) {
  if (useSeparateWavPlayer && filePath.toLowerCase().includes('.wav')) {
    if (activeSoundFile != filePath) soundProcess.stdin.write('$WAV_PLAYER.soundlocation="' + filePath + '"\n');  // Not sure if this causes a delay
    soundProcess.stdin.write('$WAV_PLAYER.Play()\n');
    return;
  }

  soundProcess.stdin.write('$PLAYER.open("' + filePath + '")\n');  // Has to be called every time
  soundProcess.stdin.write('$PLAYER.Play()\n');
}

function stopSoundProcess() {
  if (useSeparateWavPlayer && activeSoundFile.toLowerCase().includes('.wav')) {
    soundProcess.stdin.write('$WAV_PLAYER.Stop()\n');
    return;
  }

  soundProcess.stdin.write('$PLAYER.Stop()\n');
}

export async function playSound(path: string) {
  const filePath = toAbsolutePath(path);
  playSoundProcess(filePath);
  activeSoundFile = filePath;
}

export async function stopSound() {
  stopSoundProcess();
}
