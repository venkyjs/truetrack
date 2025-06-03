import { app, BrowserWindow, shell, ipcMain, dialog } from 'electron';
import { release } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'fs-extra'; // For checking if directory exists
import { secureReadJsonFile, secureWriteJsonFile } from './secureFileSystem'; // Import secure functions
import type { Project, Person } from '../src/types'; // Import Project and Person types

console.log('[Main Process] Evaluating main.ts');

// Attempt to define __filename and __dirname using import.meta.url
// Fallback to app.getAppPath() if import.meta.url is not available (e.g. in some bundled environments)
// Note: app.getAppPath() points to the app root (where package.json is),
// so paths need to be adjusted if this fallback is used.

let currentDir = '';
let currentFile = '';

try {
    console.log('[Main Process] Attempting to use import.meta.url.');
    if (typeof import.meta.url === 'string' && import.meta.url) {
        console.log('[Main Process] import.meta.url:', import.meta.url);
        currentFile = fileURLToPath(import.meta.url);
        currentDir = dirname(currentFile);
        console.log(
            '[Main Process] Defined __filename (currentFile) via import.meta.url:',
            currentFile
        );
        console.log(
            '[Main Process] Defined __dirname (currentDir) via import.meta.url:',
            currentDir
        );
    } else {
        throw new Error('import.meta.url is undefined, null, or not a string.');
    }
} catch (e) {
    console.warn('[Main Process] Failed to define __filename/__dirname using import.meta.url:', e);
    console.warn(
        '[Main Process] Falling back to app.getAppPath() and assuming standard build structure.'
    );
    // This fallback assumes that main.js will be in 'dist-electron/main/' relative to app root
    currentDir = resolve(app.getAppPath(), 'dist-electron/main');
    currentFile = join(currentDir, 'index.js'); // Assuming the output file name
    console.log('[Main Process] Fallback __filename (currentFile):', currentFile);
    console.log('[Main Process] Fallback __dirname (currentDir):', currentDir);
    // Ensure these are set for the rest of the script, even if it's a guess
    // Global __dirname and __filename are not available in ESM, so we use these local vars.
}

// Use these local, reliably defined variables instead of global __dirname
const APP_ROOT_PATH = app.getAppPath(); // Path to the application root (where package.json is)

process.env.DIST_ELECTRON = join(APP_ROOT_PATH, 'dist-electron');
process.env.DIST = join(APP_ROOT_PATH, 'dist');

// Define PUBLIC path more robustly
if (process.env.VITE_DEV_SERVER_URL) {
    process.env.PUBLIC = join(APP_ROOT_PATH, 'public');
} else {
    process.env.PUBLIC = process.env.DIST; // DIST is already joined with APP_ROOT_PATH
}

console.log('[Main Process] APP_ROOT_PATH:', APP_ROOT_PATH);
console.log('[Main Process] DIST_ELECTRON based on APP_ROOT_PATH:', process.env.DIST_ELECTRON);
console.log('[Main Process] DIST based on APP_ROOT_PATH:', process.env.DIST);
console.log('[Main Process] PUBLIC based on APP_ROOT_PATH or DIST:', process.env.PUBLIC);

// Disable GPU Acceleration for Windows 7
if (release().startsWith('6.1')) app.disableHardwareAcceleration();

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName());

if (!app.requestSingleInstanceLock()) {
    app.quit();
    process.exit(0);
}

let win: BrowserWindow | null = null;
// Define preload path directly from APP_ROOT_PATH
// User observed that the output file is dist-electron/preload.js
const PRELOAD_SCRIPT_PATH = join(APP_ROOT_PATH, 'dist-electron', 'preload.js');
console.log('[Main Process] Expected absolute preload script path:', PRELOAD_SCRIPT_PATH);
const url = process.env.VITE_DEV_SERVER_URL;
const indexHtml = join(process.env.DIST, 'index.html'); // DIST is now based on APP_ROOT_PATH

// Config file path within app's user data directory
const USER_DATA_PATH = app.getPath('userData');
const CONFIG_FILE_PATH = join(USER_DATA_PATH, 'app-config.json');

interface AppConfig {
    projectDataPath?: string;
}

async function getProjectDataPath(): Promise<string | null> {
    try {
        const config = await secureReadJsonFile<AppConfig>(CONFIG_FILE_PATH);
        if (config && config.projectDataPath && (await fs.pathExists(config.projectDataPath))) {
            process.env.PROJECT_DATA_PATH = config.projectDataPath; // Set on load
            return config.projectDataPath;
        }
    } catch (error) {
        console.error('Error reading stored project data path:', error);
    }

    const { canceled, filePaths } = await dialog.showOpenDialog({
        properties: ['openDirectory'],
        title: 'Select Folder for Project Data'
    });

    if (canceled || filePaths.length === 0) {
        dialog.showErrorBox(
            'Folder Not Selected',
            'You must select a folder to store project data. The application will now close.'
        );
        app.quit();
        return null;
    }

    const selectedPath = filePaths[0];
    try {
        await secureWriteJsonFile(CONFIG_FILE_PATH, { projectDataPath: selectedPath });
        process.env.PROJECT_DATA_PATH = selectedPath; // Set after selection and save
    } catch (error) {
        console.error('Error saving project data path:', error);
        dialog.showErrorBox(
            'Error Saving Path',
            'Could not save the selected folder path. You might be prompted again on the next launch.'
        );
    }
    return selectedPath;
}

async function createWindow(projectPathFromArgument: string) {
    // Ensure PROJECT_DATA_PATH is set from the argument passed to createWindow, which comes from getProjectDataPath
    process.env.PROJECT_DATA_PATH = projectPathFromArgument;
    console.log('[Main Process] createWindow called with projectPath:', projectPathFromArgument);
    console.log(
        '[Main Process] process.env.PROJECT_DATA_PATH in createWindow:',
        process.env.PROJECT_DATA_PATH
    );

    const iconPublicDir = process.env.PUBLIC; // PUBLIC is guaranteed to be a string by now
    let iconPath = '';
    if (iconPublicDir) {
        iconPath = join(iconPublicDir, 'favicon.ico');
    }
    console.log('[Main Process] Icon path attempt:', iconPath);

    win = new BrowserWindow({
        title: 'Project Pulse',
        icon: iconPath || undefined, // Pass undefined if iconPath is empty
        width: 1200,
        height: 800,
        autoHideMenuBar: true, // Hide the menu bar
        webPreferences: {
            preload: PRELOAD_SCRIPT_PATH, // Use the new robust path
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    if (url) {
        win.loadURL(url);
        win.webContents.openDevTools();
    } else {
        win.loadFile(indexHtml);
    }

    win.webContents.on('did-finish-load', () => {
        win?.webContents.send('main-process-message', new Date().toLocaleString());
        // Send the path obtained and used by createWindow to the renderer
        win?.webContents.send('set-project-data-path', projectPathFromArgument);
    });

    win.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('https:')) shell.openExternal(url);
        return { action: 'deny' };
    });

    ipcMain.handle('dialog:openDirectory', async () => {
        const { canceled, filePaths } = await dialog.showOpenDialog(win!, {
            properties: ['openDirectory'],
            title: 'Select New Folder for Project Data'
        });
        if (canceled || filePaths.length === 0) {
            return null;
        }
        const newPath = filePaths[0];
        try {
            await secureWriteJsonFile(CONFIG_FILE_PATH, { projectDataPath: newPath });
            process.env.PROJECT_DATA_PATH = newPath;
            win?.webContents.send('set-project-data-path', newPath);
            return newPath;
        } catch (error) {
            console.error('Error saving new project data path:', error);
            dialog.showErrorBox('Error Saving Path', 'Could not save the new folder path.');
            return null;
        }
    });

    ipcMain.handle('load-projects', async () => {
        const currentProjectDataPath = process.env.PROJECT_DATA_PATH;
        if (!currentProjectDataPath) {
            console.error('Project data path not set. Cannot load projects.');
            return [];
        }
        const projectsFilePath = join(currentProjectDataPath, 'projects.json');
        try {
            const projects = await secureReadJsonFile<Project[]>(projectsFilePath);
            return projects || [];
        } catch (error) {
            console.error('Failed to load projects:', error);
            return [];
        }
    });

    ipcMain.handle('save-projects', async (_event, projects: Project[]) => {
        const currentProjectDataPath = process.env.PROJECT_DATA_PATH;
        if (!currentProjectDataPath) {
            console.error('Project data path not set. Cannot save projects.');
            throw new Error('Project data path not configured.');
        }
        const projectsFilePath = join(currentProjectDataPath, 'projects.json');
        try {
            await secureWriteJsonFile(projectsFilePath, projects);
            return { success: true };
        } catch (error) {
            console.error('Failed to save projects:', error);
            return { success: false, error: (error as Error).message };
        }
    });

    ipcMain.handle('load-people', async () => {
        const currentProjectDataPath = process.env.PROJECT_DATA_PATH;
        if (!currentProjectDataPath) {
            console.error('Project data path not set. Cannot load people.');
            return [];
        }
        const peopleFilePath = join(currentProjectDataPath, 'people.json');
        try {
            const people = await secureReadJsonFile<Person[]>(peopleFilePath);
            return people || [];
        } catch (error) {
            console.error('Failed to load people:', error);
            return [];
        }
    });

    ipcMain.handle('save-people', async (_event, people: Person[]) => {
        const currentProjectDataPath = process.env.PROJECT_DATA_PATH;
        if (!currentProjectDataPath) {
            console.error('Project data path not set. Cannot save people.');
            throw new Error('Project data path not configured.');
        }
        const peopleFilePath = join(currentProjectDataPath, 'people.json');
        try {
            await secureWriteJsonFile(peopleFilePath, people);
            return { success: true };
        } catch (error) {
            console.error('Failed to save people:', error);
            return { success: false, error: (error as Error).message };
        }
    });

    // Temporarily comment out the schedule-notification handler
    /*
  ipcMain.handle('schedule-notification', async (_event, options: { title: string; body: string; taskDate: string }) => {
    const { title, body, taskDate } = options;
    const date = new Date(taskDate);
    const now = new Date();

    if (date <= now) {
      console.log('Notification date is in the past, not scheduling:', title);
      return { success: false, error: 'Date in past' };
    }

    // For this iteration, let's show an IMMEDIATE notification as a placeholder for scheduling logic.
    if (Notification.isSupported()) { // This line would also cause an error if Notification is not imported
      console.log(`Placeholder: Would schedule notification for ${date.toLocaleString()}: ${title}`);
      const notification = new Notification({ title: `Reminder: ${title}`, body });
      notification.show();
      notification.on('click', () => {
        console.log('Notification clicked');
        if (win) {
          if (win.isMinimized()) win.restore();
          win.focus();
        }
      });
      return { success: true, message: 'Notification shown (simulated schedule).' };
    } else {
      console.error('Notifications not supported on this system.');
      return { success: false, error: 'Notifications not supported' };
    }
  });
  */
}

app.whenReady().then(async () => {
    console.log('[Main Process] App is ready.');
    const obtainedProjectPath = await getProjectDataPath(); // This sets process.env.PROJECT_DATA_PATH internally
    if (obtainedProjectPath) {
        // process.env.PROJECT_DATA_PATH is already set by getProjectDataPath upon successful retrieval or selection
        console.log(
            '[Main Process] Project data path obtained for createWindow:',
            obtainedProjectPath
        );
        createWindow(obtainedProjectPath);
    } else {
        console.error(
            '[Main Process] No project data path obtained. App will quit if not already.'
        );
    }
});

app.on('window-all-closed', () => {
    win = null;
    if (process.platform !== 'darwin') app.quit();
});

app.on('second-instance', () => {
    if (win) {
        if (win.isMinimized()) win.restore();
        win.focus();
    }
});

app.on('activate', () => {
    const allWindows = BrowserWindow.getAllWindows();
    if (allWindows.length) {
        allWindows[0].focus();
    } else {
        getProjectDataPath().then((projectPath) => {
            if (projectPath) {
                process.env.PROJECT_DATA_PATH = projectPath;
                createWindow(projectPath);
            }
        });
    }
});

ipcMain.handle('open-win', (_, arg) => {
    const childWindow = new BrowserWindow({
        webPreferences: {
            preload: PRELOAD_SCRIPT_PATH, // Use the new robust path here as well
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    if (process.env.VITE_DEV_SERVER_URL) {
        const devUrl = process.env.VITE_DEV_SERVER_URL;
        childWindow.loadURL(`${devUrl}#${arg}`);
    } else {
        childWindow.loadFile(indexHtml, { hash: arg });
    }
});
