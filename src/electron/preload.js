import { ipcRenderer, webFrame } from "electron";

window.ipcRenderer = ipcRenderer;
window.webFrame = webFrame;

/* Exposing "on" is not currently working, disabling contextIsolation for now
contextBridge.exposeInMainWorld('ipcRenderer', {
    invoke: ipcRenderer.invoke,
    on: ipcRenderer.on,
    removeListener: ipcRenderer.removeListener
});
*/
