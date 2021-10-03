import { window } from "../window";

const messageQueue = {};

export function sendErrorMessage(message: string): void {
  window.webContents.send("message", { message: message, success: false });
}
  
export function sendSuccessMessage(message: string): void {
  window.webContents.send("message", { message: message, success: true });
}

export function saveWindowSize(width: number, height: number): void {
  const messageTimeout = messageQueue["saveWindowSize"];
  if (messageTimeout) {
    clearTimeout(messageTimeout);
  }

  // Minimum 5 seconds between each notify of change to window size
  messageQueue["saveWindowSize"] = setTimeout(() => {
    const windowSize = width + "x" + height;
    window.webContents.send("saveWindowSize", { windowSize: windowSize });
  }, 5000);
}
