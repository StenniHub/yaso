import { IpcRenderer } from "electron";

export const ipcRenderer: IpcRenderer = window.ipcRenderer;
export const invoke = ipcRenderer.invoke;
