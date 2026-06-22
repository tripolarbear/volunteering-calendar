import { app, BrowserWindow } from "electron";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getWindowEntry } from "./windowConfig.js";

const currentDir = dirname(fileURLToPath(import.meta.url));
const appRoot = join(currentDir, "..");

function createMainWindow() {
  const window = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 640,
    backgroundColor: "#f7faf8",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: join(currentDir, "preload.js"),
    },
  });

  const entry = getWindowEntry(process.env.VITE_DEV_SERVER_URL);

  if (entry.kind === "url") {
    void window.loadURL(entry.value);
    window.webContents.openDevTools({ mode: "detach" });
    return;
  }

  void window.loadFile(join(appRoot, entry.value));
}

app.whenReady().then(() => {
  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
