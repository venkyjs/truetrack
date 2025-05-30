import type { Project, Person } from './types';

export interface IElectronAPI {
  openDirectoryDialog: () => Promise<string | null>;
  onSetProjectDataPath: (callback: (path: string) => void) => () => void; // Returns a cleanup function
  loadProjects: () => Promise<Project[]>;
  saveProjects: (projects: Project[]) => Promise<{success: boolean, error?: string}>;
  loadPeople: () => Promise<Person[]>;
  savePeople: (people: Person[]) => Promise<{success: boolean, error?: string}>;
  scheduleNotification: (options: { title: string; body: string; taskDate: string }) => Promise<{success: boolean, error?: string, message?: string}>;
  // Define other exposed APIs here as they are added
}

// Augment the window interface
declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
} 