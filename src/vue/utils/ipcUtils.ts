import { IpcRenderer } from "electron";

export const isWindows = window.isWindows;
export const sep = isWindows ? "\\" : "/";
export const ipcRenderer: IpcRenderer = window.ipcRenderer;
export const invoke = ipcRenderer.invoke;
