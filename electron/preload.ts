import { contextBridge, ipcRenderer } from 'electron';
import type { Project, Person } from '../src/types'; // Import Person type

console.log('[Preload] Preload script evaluating.');

console.log('[Preload] Attempting to expose electronAPI...');
try {
    contextBridge.exposeInMainWorld('electronAPI', {
        openDirectoryDialog: () => ipcRenderer.invoke('dialog:openDirectory'),
        // Listen for project data path changes from main process
        onSetProjectDataPath: (callback: (path: string) => void) => {
            const handler = (_event: Electron.IpcRendererEvent, path: string) => callback(path);
            ipcRenderer.on('set-project-data-path', handler);
            // Return a cleanup function to remove the listener
            return () => {
                ipcRenderer.removeListener('set-project-data-path', handler);
            };
        },
        loadProjects: (): Promise<Project[]> => ipcRenderer.invoke('load-projects'),
        saveProjects: (projects: Project[]): Promise<{ success: boolean; error?: string }> =>
            ipcRenderer.invoke('save-projects', projects),

        loadPeople: (): Promise<Person[]> => ipcRenderer.invoke('load-people'),
        savePeople: (people: Person[]): Promise<{ success: boolean; error?: string }> =>
            ipcRenderer.invoke('save-people', people)
        // Temporarily comment out scheduleNotification if it was causing issues during build
        /* scheduleNotification: (options: { title: string; body: string; taskDate: string }): Promise<{success: boolean, error?: string, message?: string}> => 
      ipcRenderer.invoke('schedule-notification', options), */
        // Add other APIs you want to expose here
    });
    console.log('[Preload] electronAPI exposed successfully.');
} catch (error) {
    console.error('[Preload] Error exposing electronAPI:', error);
}

function domReady(condition: DocumentReadyState[] = ['complete', 'interactive']) {
    return new Promise((resolve) => {
        if (condition.includes(document.readyState)) {
            resolve(true);
        } else {
            document.addEventListener('readystatechange', () => {
                if (condition.includes(document.readyState)) {
                    resolve(true);
                }
            });
        }
    });
}

const safeDOM = {
    append(parent: HTMLElement, child: HTMLElement) {
        if (!Array.from(parent.children).find((e) => e === child)) {
            return parent.appendChild(child);
        }
    },
    remove(parent: HTMLElement, child: HTMLElement) {
        if (Array.from(parent.children).find((e) => e === child)) {
            return parent.removeChild(child);
        }
    }
};

function useLoading() {
    const className = `loaders-css__square-spin`;
    const style = document.createElement('style');
    const ospin = document.createElement('div');

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
    ospin.innerHTML = '<div></div>';

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

// Ensure these are not causing issues if the preload script context is problematic
const { appendLoading, removeLoading } = useLoading();
domReady().then(appendLoading);

window.onmessage = (ev) => {
    if (ev.data.payload === 'removeLoading') removeLoading();
};

setTimeout(removeLoading, 4999);

console.log('[Preload] Preload script evaluation complete.');
