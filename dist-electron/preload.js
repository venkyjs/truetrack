import { contextBridge, ipcRenderer } from "electron";
console.log("[Preload] Preload script evaluating.");
console.log("[Preload] Attempting to expose electronAPI...");
try {
  contextBridge.exposeInMainWorld("electronAPI", {
    openDirectoryDialog: () => ipcRenderer.invoke("dialog:openDirectory"),
    // Listen for project data path changes from main process
    onSetProjectDataPath: (callback) => {
      const handler = (_event, path) => callback(path);
      ipcRenderer.on("set-project-data-path", handler);
      return () => {
        ipcRenderer.removeListener("set-project-data-path", handler);
      };
    },
    loadProjects: () => ipcRenderer.invoke("load-projects"),
    saveProjects: (projects) => ipcRenderer.invoke("save-projects", projects),
    loadPeople: () => ipcRenderer.invoke("load-people"),
    savePeople: (people) => ipcRenderer.invoke("save-people", people)
    // Temporarily comment out scheduleNotification if it was causing issues during build
    /* scheduleNotification: (options: { title: string; body: string; taskDate: string }): Promise<{success: boolean, error?: string, message?: string}> => 
    ipcRenderer.invoke('schedule-notification', options), */
    // Add other APIs you want to expose here
  });
  console.log("[Preload] electronAPI exposed successfully.");
} catch (error) {
  console.error("[Preload] Error exposing electronAPI:", error);
}
function domReady(condition = ["complete", "interactive"]) {
  return new Promise((resolve) => {
    if (condition.includes(document.readyState)) {
      resolve(true);
    } else {
      document.addEventListener("readystatechange", () => {
        if (condition.includes(document.readyState)) {
          resolve(true);
        }
      });
    }
  });
}
const safeDOM = {
  append(parent, child) {
    if (!Array.from(parent.children).find((e) => e === child)) {
      return parent.appendChild(child);
    }
  },
  remove(parent, child) {
    if (Array.from(parent.children).find((e) => e === child)) {
      return parent.removeChild(child);
    }
  }
};
function useLoading() {
  const className = `loaders-css__square-spin`;
  const style = document.createElement("style");
  const ospin = document.createElement("div");
  style.innerHTML = `
    .${className} > div {
      animation-fill-mode: both;
      width: 50px;
      height: 50px;
      background: #fff;
      animation: square-spin 3s 0s cubic-bezier(0.09, 0.57, 0.49, 0.9) infinite;
    }
    .app-loading-wrap {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #282c34;
      z-index: 9;
    }
  `;
  ospin.classList.add(className);
  ospin.innerHTML = "<div></div>";
  return {
    appendLoading() {
      safeDOM.append(document.head, style);
      safeDOM.append(document.body, ospin);
    },
    removeLoading() {
      safeDOM.remove(document.head, style);
      safeDOM.remove(document.body, ospin);
    }
  };
}
const { appendLoading, removeLoading } = useLoading();
domReady().then(appendLoading);
window.onmessage = (ev) => {
  if (ev.data.payload === "removeLoading") removeLoading();
};
setTimeout(removeLoading, 4999);
console.log("[Preload] Preload script evaluation complete.");
4999);
console.log("[Preload] Preload script evaluation complete.");
