import { IpcRenderer } from "electron";

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

export const ipcRenderer: IpcRenderer = window.ipcRenderer;
export const invoke = ipcRenderer.invoke;
