import { useState, useEffect } from 'react';
import type { FC } from 'react';
// import { дорога } from './assets'; // Removed unused import causing error
// Import global types
import type { Project, Task as ProjectTask, Person } from './types';
import { idbGet, idbSet, idbRemove } from './utils/indexedDB'; // Added import
// import { addProject, getProjects, updateProject, deleteProject } from './utils/indexedDB'; // This was the original error from the build output relating to an incorrect import

import ProjectLane from './components/ProjectLane';
import styles from './App.module.css';
import AppHeader from './components/AppHeader/AppHeader';
import PreferencesDialog from './components/PreferencesDialog/PreferencesDialog';
import './components/TooltipStyles.css'; // Import custom tooltip styles
// import ProjectForm from './components/ProjectForm'; // These were incorrectly added in a previous edit
// import ProjectList from './components/ProjectList'; // These were incorrectly added in a previous edit
// import WallpaperSelector from './components/WallpaperSelector'; // These were incorrectly added in a previous edit
// import { wallpapers } from './utils/wallpapers'; // These were incorrectly added in a previous edit
// import './App.css'; // This was fine

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

// THIS WAS THE UNUSED VARIABLE IDENTIFIED IN THE BUILD OUTPUT
// const initialProjectsData: Project[] = [
//   {
//     id: '1',
//     name: 'Project Alpha',
//     description: 'Description for Project Alpha',
//     startDate: '2023-01-01',
//     endDate: '2023-06-30',
//     status: 'In Progress',
//     assignedTo: 'John Doe',
//     tags: ['React', 'TypeScript'],
//     tasks: [
//       { id: 'task1', name: 'Setup environment', status: 'Completed' },
//       { id: 'task2', name: 'Develop feature X', status: 'In Progress' },
//     ],
//     budget: 50000,
//     actualCost: 25000,
//     priority: 'High',
//     repoUrl: 'https://github.com/user/project-alpha',
//   },
//   {
//     id: '2',
//     name: 'Project Beta',
//     description: 'Description for Project Beta',
//     startDate: '2023-03-15',
//     endDate: '2023-09-30',
//     status: 'Planning',
//     assignedTo: 'Jane Smith',
//     tags: ['Angular', 'Node.js'],
//     tasks: [
//       { id: 'task3', name: 'Requirement gathering', status: 'Pending' },
//     ],
//     budget: 75000,
//     priority: 'Medium',
//   },
// ];

const App: FC = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [nextProjectId, setNextProjectId] = useState<number>(1);
    const [isPreferencesOpen, setIsPreferencesOpen] = useState<boolean>(false);
    const [appWallpaper, setAppWallpaper] = useState<string | null>(null);
    const [dataLoaded, setDataLoaded] = useState(false);
    // const [initialLoadHasProjects, setInitialLoadHasProjects] = useState<boolean>(false); // THIS WAS THE UNUSED VARIABLE IDENTIFIED IN THE BUILD OUTPUT
    const [globalPeople, setGlobalPeople] = useState<Person[]>(initialGlobalPeople); // New state for people
    const [searchTerm, setSearchTerm] = useState<string>(''); // New state for search
    // const [isModalOpen, setIsModalOpen] = useState(false); // This was NOT part of the original App.tsx, it was currentProject from the old version
    // const [currentProject, setCurrentProject] = useState<Project | null>(null); // This was NOT part of the original App.tsx
    // const [selectedWallpaper, setSelectedWallpaper] = useState<string>(() => { // This was NOT part of the original App.tsx
    //     return localStorage.getItem('selectedWallpaper') || wallpapers[0].value;
    // });

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
                    // setInitialLoadHasProjects(true); // Part of the original unused variable
                } else {
                    // If no saved projects or empty array, set projects to empty
                    // and initialLoadHasProjects to false.
                    // We won't use initialProjectsData here anymore.
                    setProjects([]);
                    // setInitialLoadHasProjects(false); // Part of the original unused variable
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
                // setInitialLoadHasProjects(false); // Part of the original unused variable
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

    const handleUpdateProjectTaskColor = (projectId: string, newTaskColor?: string) => {
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

    const handleSearchChange = (newSearchTerm: string) => {
        setSearchTerm(newSearchTerm.toLowerCase());
    };

    const filteredProjects = projects.filter((project) => {
        const projectTitleMatch = project.title.toLowerCase().includes(searchTerm);
        const taskMatch = project.tasks.some((task) =>
            task.title.toLowerCase().includes(searchTerm)
        );
        return projectTitleMatch || taskMatch;
    });

    return (
        <>
            <AppHeader
                onOpenPreferences={() => setIsPreferencesOpen(true)}
                onAddProject={handleAddProject}
                onSearchChange={handleSearchChange}
            />
            <main
                className={`${styles.mainContentContainer} ${
                    dataLoaded && projects.length === 0 ? styles.centerContent : ''
                }`}
            >
                {dataLoaded && projects.length === 0 ? (
                    <div className={styles.noProjectsMessage}>
                        No projects available. Click the '+' button to add a new project.
                    </div>
                ) : (
                    filteredProjects.map((project) => (
                        <ProjectLane
                            key={project.id}
                            project={project}
                            people={globalPeople} // Changed from availablePeople to globalPeople (state)
                            findOrCreatePerson={handleFindOrCreatePerson} // Added prop
                            onDeleteProject={handleDeleteProject}
                            onUpdateProjectTitle={handleUpdateProjectTitle}
                            onUpdateTask={handleUpdateTask}
                            onAddTask={handleAddTask}
                            onDeleteTask={handleDeleteTask}
                            onUpdateProjectTaskColor={handleUpdateProjectTaskColor}
                            highlightTerm={searchTerm}
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
