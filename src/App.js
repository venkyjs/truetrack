import React, { useState, useEffect } from 'react';
import ProjectLane from './components/ProjectLane';
import styles from './App.module.css';
import AppHeader from './components/AppHeader/AppHeader.tsx';
import PreferencesDialog from './components/PreferencesDialog/PreferencesDialog.tsx';

interface ProjectTaskItem {
    id: string;
    text: string;
    completed: boolean;
}

interface Person {
    id: string;
    name: string;
}

interface ProjectTask {
    id: string;
    title: string;
    items: ProjectTaskItem[];
    completedItems: ProjectTaskItem[]; // Assuming same structure for completed
    assignedPeople: Person[];
    reminder: string | null;
    taskColor: string | null;
}

interface Project {
    id: string;
    title: string;
    color: string;
    tasks: ProjectTask[];
}

const initialProjectsData: Project[] = [
    {
        id: 'project-1',
        title: 'Project Alpha',
        color: '#FFDDC1', // Light Orange
        tasks: [
            {
                id: 'task-1-1',
                title: 'Develop Feature X',
                items: [
                    { id: 'item-1-1-1', text: 'Design UI mockups', completed: true },
                    { id: 'item-1-1-2', text: 'Implement frontend logic', completed: false },
                    { id: 'item-1-1-3', text: 'Write unit tests', completed: false }
                ],
                completedItems: [],
                assignedPeople: [{ id: 'person-1', name: 'Alice' }],
                reminder: null,
                taskColor: null // Default, can be overridden by user
            },
            {
                id: 'task-1-2',
                title: 'Setup CI/CD Pipeline',
                items: [
                    { id: 'item-1-2-1', text: 'Configure Jenkins', completed: true },
                    { id: 'item-1-2-2', text: 'Define build stages', completed: true }
                ],
                completedItems: [],
                assignedPeople: [],
                reminder: '2023-12-15T10:00',
                taskColor: '#FFFACD' // Lemon Chiffon
            }
        ]
    },
    {
        id: 'project-2',
        title: 'Marketing Campaign',
        color: '#C1FFD7', // Light Green
        tasks: [
            {
                id: 'task-2-1',
                title: 'Create Ad Copy',
                items: [
                    { id: 'item-2-1-1', text: 'Draft initial versions', completed: false },
                    { id: 'item-2-1-2', text: 'Review with team', completed: false }
                ],
                completedItems: [],
                assignedPeople: [{ id: 'person-2', name: 'Bob' }],
                reminder: null,
                taskColor: '#E6E6FA' // Lavender
            }
        ]
    },
    {
        id: 'project-3',
        title: 'Website Redesign',
        color: '#D1C1FF', // Light Purple
        tasks: []
    }
];

const availablePeople: Person[] = [
    { id: 'person-1', name: 'Alice' },
    { id: 'person-2', name: 'Bob' },
    { id: 'person-3', name: 'Charlie' },
    { id: 'person-4', name: 'Diana' },
    { id: 'person-5', name: 'Edward' }
];

function App() {
    const [projects, setProjects] = useState<Project[]>(() => {
        const savedProjects = localStorage.getItem('projectsData');
        return savedProjects ? JSON.parse(savedProjects) : initialProjectsData;
    });
    const [nextProjectId, setNextProjectId] = useState<number>(() => {
        if (projects.length === 0) return 1;
        const maxId = Math.max(...projects.map((p) => parseInt(p.id.split('-')[1], 10)));
        return maxId + 1;
    });

    const [isPreferencesOpen, setIsPreferencesOpen] = useState<boolean>(false);
    const [appWallpaper, setAppWallpaper] = useState<string | null>(localStorage.getItem('appWallpaper') || null);

    useEffect(() => {
        localStorage.setItem('projectsData', JSON.stringify(projects));
    }, [projects]);

    useEffect(() => {
        if (appWallpaper) {
            localStorage.setItem('appWallpaper', appWallpaper);
            document.body.style.backgroundImage = `url(${appWallpaper})`;
            document.body.style.backgroundSize = 'cover';
            document.body.style.backgroundPosition = 'center';
            document.body.style.backgroundRepeat = 'no-repeat';
        } else {
            localStorage.removeItem('appWallpaper');
            document.body.style.backgroundImage = '';
        }
    }, [appWallpaper]);

    const handleAddProject = () => {
        const newProject: Project = {
            id: `project-${nextProjectId}`,
            title: `Project ${nextProjectId}`,
            color: '#E0E0E0', 
            tasks: []
        };
        setProjects([...projects, newProject]);
        setNextProjectId((prevId) => prevId + 1);
    };

    const handleDeleteProject = (projectId: string) => {
        setProjects(projects.filter((p) => p.id !== projectId));
    };

    const handleUpdateProjectTitle = (projectId: string, newTitle: string) => {
        setProjects(projects.map((p) => (p.id === projectId ? { ...p, title: newTitle } : p)));
    };

    const handleUpdateProjectColor = (projectId: string, newColor: string) => {
        setProjects(projects.map((p) => (p.id === projectId ? { ...p, color: newColor } : p)));
    };

    const handleSaveTask = (projectId: string, taskData: Partial<ProjectTask>) => {
        setProjects(
            projects.map((project) => {
                if (project.id === projectId) {
                    const taskExists = project.tasks.some((task) => task.id === taskData.id);
                    if (taskExists) {
                        return {
                            ...project,
                            tasks: project.tasks.map((task) =>
                                task.id === taskData.id ? { ...task, ...taskData } as ProjectTask : task
                            )
                        };
                    } else {
                        const newTask: ProjectTask = {
                            id: `task-${projectId}-${Date.now()}`,
                            title: taskData.title || 'New Task',
                            items: [],
                            completedItems: [],
                            assignedPeople: [],
                            reminder: null,
                            taskColor: '#fffacd', 
                            ...taskData
                        };
                        return {
                            ...project,
                            tasks: [...project.tasks, newTask]
                        };
                    }
                }
                return project;
            })
        );
    };

    const handleDeleteTask = (projectId: string, taskId: string) => {
        setProjects(
            projects.map((project) => {
                if (project.id === projectId) {
                    return {
                        ...project,
                        tasks: project.tasks.filter((task) => task.id !== taskId)
                    };
                }
                return project;
            })
        );
    };

    const handleWallpaperChange = (wallpaper: string | null) => {
        setAppWallpaper(wallpaper);
    };

    return (
        <div className={styles.app}>
            <AppHeader onOpenPreferences={() => setIsPreferencesOpen(true)} />
            <main className={styles.mainContent}>
                {projects.map((project) => (
                    <ProjectLane
                        key={project.id}
                        project={project}
                        onDeleteProject={handleDeleteProject}
                        onUpdateProjectTitle={handleUpdateProjectTitle}
                        onUpdateProjectColor={handleUpdateProjectColor}
                        onSaveTask={(taskData: Partial<ProjectTask>) => handleSaveTask(project.id, taskData)}
                        onDeleteTask={(taskId: string) => handleDeleteTask(project.id, taskId)}
                        availablePeople={availablePeople}
                    />
                ))}
                <button onClick={handleAddProject} className={styles.addProjectBtn}>
                    + Add New Project
                </button>
            </main>
            <PreferencesDialog
                isOpen={isPreferencesOpen}
                onClose={() => setIsPreferencesOpen(false)}
                onWallpaperChange={handleWallpaperChange}
            />
        </div>
    );
}

export default App;
