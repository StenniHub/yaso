import { IpcRenderer } from "electron";

export const ipcRenderer: IpcRenderer = window.ipcRenderer;
export const invoke = ipcRenderer.invoke;

// Removes all listeners for any external control flow, must include actions for both files and folders
export function removeAllListeners(): void {
  ipcRenderer.removeAllListeners("selectNext");
  ipcRenderer.removeAllListeners("selectPrevious");
  ipcRenderer.removeAllListeners("refreshSelected");
  ipcRenderer.removeAllListeners("toggleFolder");
}
