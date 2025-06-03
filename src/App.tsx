import { useState, useEffect } from 'react';
import type { FC } from 'react';
// Import global types
import type { Project, Task as ProjectTask, Person } from './types';
import { idbGet, idbSet, idbRemove } from './utils/indexedDB'; // Added import

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

const App: FC = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [nextProjectId, setNextProjectId] = useState<number>(1);
    const [isPreferencesOpen, setIsPreferencesOpen] = useState<boolean>(false);
    const [appWallpaper, setAppWallpaper] = useState<string | null>(null);
    const [dataLoaded, setDataLoaded] = useState(false);
    const [initialLoadHasProjects, setInitialLoadHasProjects] = useState<boolean>(false);
    const [globalPeople, setGlobalPeople] = useState<Person[]>(initialGlobalPeople); // New state for people

    // Load initial data from IndexedDB
    useEffect(() => {
        const loadData = async () => {
            try {
                const savedProjects = await idbGet<Project[]>('projectsData');
                const wallpaper = await idbGet<string>('appWallpaper');
                const savedPeople = await idbGet<Person[]>('globalPeopleData'); // Load people

                if (savedProjects && savedProjects.length > 0) {
                    // Check if savedProjects is not null and not empty
                    const parsedProjects = savedProjects.map((p: Project) => ({
                        ...p,
                        taskColor: p.taskColor || getRandomPastelColor(),
                        tasks: p.tasks.map((t) => ({
                            ...t,
                            reminder: t.reminder ? new Date(t.reminder).toISOString() : undefined
                        }))
                    }));
                    setProjects(parsedProjects);
                    setInitialLoadHasProjects(true); // Mark that initial load had projects
                } else {
                    // If no saved projects or empty array, set projects to empty
                    // and initialLoadHasProjects to false.
                    // We won't use initialProjectsData here anymore.
                    setProjects([]);
                    setInitialLoadHasProjects(false);
                }

                if (savedPeople && savedPeople.length > 0) {
                    // If people are saved, use them
                    setGlobalPeople(savedPeople);
                } else {
                    // Otherwise, use initial (and save them for next time if not empty)
                    if (initialGlobalPeople.length > 0) {
                        // No need to setGlobalPeople again if it's already initialGlobalPeople
                        // but we should save it if it's the first run with people
                        await idbSet('globalPeopleData', initialGlobalPeople);
                    }
                    // If initialGlobalPeople is also empty, globalPeople remains empty
                }

                if (wallpaper) {
                    setAppWallpaper(wallpaper);
                }
            } catch (error) {
                console.error('Failed to load data from IndexedDB', error);
                // Fallback to empty state if IDB fails
                setProjects([]);
                setInitialLoadHasProjects(false);
            } finally {
                setDataLoaded(true);
            }
        };
        loadData();
    }, []);

    // Effect to derive nextProjectId from projects
    useEffect(() => {
        if (!dataLoaded) return; // Ensure data has been loaded or attempted

        if (projects.length === 0) {
            setNextProjectId(1);
            return;
        }
        const ids = projects.map((p) => parseInt(p.id.split('-')[1] || '0', 10));
        const numericIds = ids.filter((id) => !isNaN(id));
        if (numericIds.length === 0) {
            setNextProjectId(1);
            return;
        }
        const maxId = Math.max(...numericIds);
        setNextProjectId(maxId < 0 ? 1 : maxId + 1); // Ensure nextId is at least 1
    }, [projects, dataLoaded]);

    // Save projects to IndexedDB
    useEffect(() => {
        if (dataLoaded) {
            // Check only dataLoaded
            if (projects.length > 0) {
                idbSet('projectsData', projects).catch((error) =>
                    console.error('Failed to save projects to IndexedDB', error)
                );
            } else {
                // If projects array becomes empty AFTER initial load
                idbRemove('projectsData').catch((error) =>
                    console.error('Failed to remove projectsData from IndexedDB', error)
                );
            }
            // Save globalPeople to IndexedDB whenever it changes after initial load
            if (globalPeople.length > 0) {
                idbSet('globalPeopleData', globalPeople).catch((error) =>
                    console.error('Failed to save globalPeople to IndexedDB', error)
                );
            } else {
                idbRemove('globalPeopleData').catch((error) =>
                    console.error('Failed to remove globalPeopleData from IndexedDB', error)
                );
            }
        }
    }, [projects, globalPeople, dataLoaded]);

    // Save wallpaper and update body style
    useEffect(() => {
        if (!dataLoaded) return; // Don't run on initial load before wallpaper is fetched

        if (appWallpaper) {
            idbSet('appWallpaper', appWallpaper).catch((error) =>
                console.error('Failed to save appWallpaper to IndexedDB', error)
            );
            document.body.style.backgroundImage = `url(${appWallpaper})`;
            document.body.style.backgroundPosition = 'center';
            document.body.style.backgroundSize = 'cover';
            document.body.style.backgroundRepeat = 'no-repeat';
        } else {
            idbRemove('appWallpaper').catch((error) =>
                console.error('Failed to remove appWallpaper from IndexedDB', error)
            );
            document.body.style.backgroundImage = '';
        }
    }, [appWallpaper, dataLoaded]);

    const handleAddProject = () => {
        const newProject: Project = {
            id: `project-${nextProjectId}`,
            title: `Project ${nextProjectId}`,
            tasks: [],
            taskColor: getRandomPastelColor()
        };
        setProjects([...projects, newProject]);
        // nextProjectId will update via its own useEffect
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

    // New function to find or create a person
    const handleFindOrCreatePerson = (name: string): string => {
        const Tname = name.trim();
        const existingPerson = globalPeople.find(
            (p) => p.name.toLowerCase() === Tname.toLowerCase()
        );
        if (existingPerson) {
            return existingPerson.id;
        }
        const newPerson: Person = {
            id: `person-${crypto.randomUUID()}`,
            name: Tname,
            initials: Tname.substring(0, 2).toUpperCase() // Basic initials logic
        };
        setGlobalPeople((prevPeople) => [...prevPeople, newPerson]);
        // The useEffect for globalPeople will handle saving to IDB
        return newPerson.id;
    };

    return (
        <>
            <AppHeader
                onOpenPreferences={() => setIsPreferencesOpen(true)}
                onAddProject={handleAddProject}
            />
            <main className={styles.mainContentContainer}>
                {dataLoaded && projects.length === 0 ? (
                    <div className={styles.noProjectsMessage}>
                        No projects available. Click the '+' button to add a new project.
                    </div>
                ) : (
                    projects.map((project) => (
                        <ProjectLane
                            key={project.id}
                            project={project}
                            people={globalPeople} // Changed from availablePeople to globalPeople (state)
                            findOrCreatePerson={handleFindOrCreatePerson} // Added prop
                            onDeleteProject={handleDeleteProject}
                            onUpdateTitle={handleUpdateProjectTitle}
                            onUpdateTask={handleUpdateTask}
                            onAddTask={handleAddTask}
                            onDeleteTask={handleDeleteTask}
                            onUpdateProjectDefaultTaskColor={handleUpdateProjectDefaultTaskColor}
                        />
                    ))
                )}
            </main>
            <PreferencesDialog
                isOpen={isPreferencesOpen}
                onClose={() => setIsPreferencesOpen(false)}
                onWallpaperChange={handleWallpaperChange}
            />
        </>
    );
};

export default App;
