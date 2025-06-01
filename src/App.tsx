import React, { useState, useEffect } from 'react';
import type { FC } from 'react';
// Import global types
import type { Project, Task as ProjectTask, Person, TaskItem as ProjectTaskItem } from './types';

import ProjectLane from './components/ProjectLane';
import styles from './App.module.css';
import AppHeader from './components/AppHeader/AppHeader';
import PreferencesDialog from './components/PreferencesDialog/PreferencesDialog';
import './components/TooltipStyles.css'; // Import custom tooltip styles

// Removed local type definitions, using global ones imported above

const getRandomPastelColor = () => {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 70%, 85%)`;
};

const initialGlobalPeople: Person[] = [
    { id: 'person-1', name: 'Alice', initials: 'AL' }, // Added initials as per global type
    { id: 'person-2', name: 'Bob', initials: 'BO' },
    { id: 'person-3', name: 'Charlie', initials: 'CH' },
    { id: 'person-4', name: 'Diana', initials: 'DI' },
    { id: 'person-5', name: 'Edward', initials: 'ED' }
];

const initialProjectsData: Project[] = [
    {
        id: 'project-1',
        title: 'Project Alpha',
        taskColor: getRandomPastelColor(),
        tasks: [
            {
                id: 'task-1-1',
                title: 'Develop Feature X',
                items: [
                    { id: 'item-1-1-1', text: 'Design UI mockups', completed: true },
                    { id: 'item-1-1-2', text: 'Implement frontend logic', completed: false },
                    { id: 'item-1-1-3', text: 'Write unit tests', completed: false }
                ],
                assignedPersons: ['person-1'], // Array of Person IDs
                reminder: undefined, // Matched to global type (optional Date | string)
                color: undefined // Task specific color, optional in global type
            },
            {
                id: 'task-1-2',
                title: 'Setup CI/CD Pipeline',
                items: [
                    { id: 'item-1-2-1', text: 'Configure Jenkins', completed: true },
                    { id: 'item-1-2-2', text: 'Define build stages', completed: true }
                ],
                assignedPersons: [],
                reminder: new Date('2023-12-15T10:00').toISOString(), // Match global type
                color: '#FFFACD'
            }
        ]
    },
    {
        id: 'project-2',
        title: 'Marketing Campaign',
        taskColor: getRandomPastelColor(),
        tasks: [
            {
                id: 'task-2-1',
                title: 'Create Ad Copy',
                items: [
                    { id: 'item-2-1-1', text: 'Draft initial versions', completed: false },
                    { id: 'item-2-1-2', text: 'Review with team', completed: false }
                ],
                assignedPersons: ['person-2'],
                reminder: undefined,
                color: '#E6E6FA'
            }
        ]
    },
    {
        id: 'project-3',
        title: 'Website Redesign',
        taskColor: getRandomPastelColor(),
        tasks: []
    }
];

export const availablePeople: Person[] = [...initialGlobalPeople];

const App: FC = () => {
    const [projects, setProjects] = useState<Project[]>(() => {
        const savedProjects = localStorage.getItem('projectsData');
        try {
            const parsedProjects = savedProjects ? JSON.parse(savedProjects) : initialProjectsData;
            return parsedProjects.map((p: Project) => ({
                ...p,
                taskColor: p.taskColor || getRandomPastelColor(),
                tasks: p.tasks.map((t) => ({
                    ...t,
                    reminder: t.reminder ? new Date(t.reminder).toISOString() : undefined
                }))
            }));
        } catch (error) {
            console.error('Failed to parse projectsData from localStorage', error);
            return initialProjectsData.map((p) => ({
                ...p,
                taskColor: p.taskColor || getRandomPastelColor(),
                tasks: p.tasks.map((t) => ({
                    ...t,
                    reminder: t.reminder ? new Date(t.reminder).toISOString() : undefined
                }))
            }));
        }
    });

    const [nextProjectId, setNextProjectId] = useState<number>(() => {
        if (projects.length === 0) return 1;
        const ids = projects.map((p) => parseInt(p.id.split('-')[1] || '0', 10));
        const numericIds = ids.filter((id) => !isNaN(id));
        if (numericIds.length === 0) return 1;
        const maxId = Math.max(...numericIds);
        return maxId < 0 ? 1 : maxId + 1;
    });

    const [isPreferencesOpen, setIsPreferencesOpen] = useState<boolean>(false);
    const [appWallpaper, setAppWallpaper] = useState<string | null>(() => {
        return localStorage.getItem('appWallpaper') || null;
    });

    useEffect(() => {
        localStorage.setItem('projectsData', JSON.stringify(projects));
    }, [projects]);

    useEffect(() => {
        if (appWallpaper) {
            localStorage.setItem('appWallpaper', appWallpaper);
            document.body.style.backgroundImage = `url(${appWallpaper})`;
            document.body.style.backgroundPosition = 'center';
            document.body.style.backgroundSize = 'cover';
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
            tasks: [],
            taskColor: getRandomPastelColor()
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

    const handleUpdateProjectDefaultTaskColor = (projectId: string, newTaskColor?: string) => {
        setProjects(
            projects.map((p) =>
                p.id === projectId ? { ...p, taskColor: newTaskColor || getRandomPastelColor() } : p
            )
        );
    };

    const handleUpdateTask = (
        projectId: string,
        taskId: string,
        updatedTaskData: Partial<Omit<ProjectTask, 'id'>>
    ) => {
        setProjects(
            projects.map((p) => {
                if (p.id === projectId) {
                    return {
                        ...p,
                        tasks: p.tasks.map((t) =>
                            t.id === taskId ? { ...t, ...updatedTaskData } : t
                        )
                    };
                }
                return p;
            })
        );
    };

    const handleAddTask = (projectId: string, taskTitle: string) => {
        const project = projects.find((p) => p.id === projectId);
        if (!project) return;

        const newTask: ProjectTask = {
            id: `task-${projectId}-${Date.now()}`,
            title: taskTitle,
            items: [],
            assignedPersons: [],
            reminder: undefined,
            color: undefined
        };
        setProjects(
            projects.map((p) => (p.id === projectId ? { ...p, tasks: [...p.tasks, newTask] } : p))
        );
    };

    const handleDeleteTask = (projectId: string, taskId: string) => {
        setProjects(
            projects.map((projectValue) => {
                if (projectValue.id === projectId) {
                    return {
                        ...projectValue,
                        tasks: projectValue.tasks.filter((task) => task.id !== taskId)
                    };
                }
                return projectValue;
            })
        );
    };

    const handleWallpaperChange = (wallpaper: string | null) => {
        setAppWallpaper(wallpaper);
    };

    return (
        <div className={styles.app}>
            <AppHeader
                onOpenPreferences={() => setIsPreferencesOpen(true)}
                onAddProject={handleAddProject} // Pass handleAddProject
            />
            <main className={styles.mainContent}>
                {projects.map((project) => (
                    <ProjectLane
                        key={project.id}
                        project={project}
                        people={availablePeople}
                        findOrCreatePerson={(name: string) => {
                            const existing = availablePeople.find(
                                (p) => p.name.toLowerCase() === name.toLowerCase()
                            );
                            if (existing) return existing.id;
                            const newPerson: Person = {
                                id: crypto.randomUUID(),
                                name,
                                initials: name.substring(0, 2).toUpperCase()
                            };
                            availablePeople.push(newPerson);
                            return newPerson.id;
                        }}
                        onDeleteProject={handleDeleteProject}
                        onUpdateProjectTitle={handleUpdateProjectTitle}
                        onUpdateProjectTaskColor={handleUpdateProjectDefaultTaskColor}
                        onAddTask={handleAddTask}
                        onUpdateTask={handleUpdateTask}
                        onDeleteTask={handleDeleteTask}
                    />
                ))}
            </main>
            <PreferencesDialog
                isOpen={isPreferencesOpen}
                onClose={() => setIsPreferencesOpen(false)}
                onWallpaperChange={handleWallpaperChange}
            />
        </div>
    );
};

export default App;
