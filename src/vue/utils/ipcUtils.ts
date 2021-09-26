import { IpcRenderer } from "electron";

export const ipcRenderer: IpcRenderer = window.ipcRenderer;
export const invoke = ipcRenderer.invoke;

export async function selectFile(path: string): Promise<string> {
  return invoke("selectFile", path).then(result => {
    return result.canceled ? null : result.filePaths[0];
  });
}

export async function selectFolder(path: string): Promise<string> {
  return invoke("selectFolder", path).then(result => {
    return result.canceled ? null : result.filePaths[0];
  });
}

// Removes all listeners for any external control flow, must include actions for both files and folders
export function removeAllListeners(): void {
  ipcRenderer.removeAllListeners("selectNext");
  ipcRenderer.removeAllListeners("selectPrevious");
  ipcRenderer.removeAllListeners("refreshSelected");
  ipcRenderer.removeAllListeners("toggleFolder");
}
