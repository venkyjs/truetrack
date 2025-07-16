export interface TaskItem {
    id: string;
    text: string;
    completed: boolean;
}

export interface Person {
    id: string;
    name: string;
    initials: string; // e.g., "JD" for "John Doe"
}

export interface Task {
    id: string;
    title: string;
    items: TaskItem[];
    assignedPersons: string[]; // Array of Person IDs
    reminder?: Date | string; // ISO string or Date object
    color?: string; // Optional: if tasks can have individual colors override project default
    archived?: boolean; // Optional: indicates if task is archived
}

export interface Project {
    id: string;
    title: string;
    tasks: Task[];
    taskColor: string; // Default pastel color for tasks in this project
    position: number; // Order position of the project
}

// For storing people centrally
export interface PeopleStore {
    people: Person[];
}
