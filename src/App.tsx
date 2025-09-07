import { useState, useEffect, useMemo } from 'react';
import type { FC } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
// import { дорога } from './assets'; // Removed unused import causing error
// Import global types
import type { Project, Task as ProjectTask, Person, Note } from './types';
import { idbGet, idbSet, idbRemove } from './utils/indexedDB'; // Added import
import { notesApi, syncApi } from './utils/apiUtils';
// import { addProject, getProjects, updateProject, deleteProject } from './utils/indexedDB'; // This was the original error from the build output relating to an incorrect import

import ProjectLane from './components/ProjectLane';
import Notes from './components/Notes/Notes';
import styles from './App.module.css';
import AppHeader from './components/AppHeader/AppHeader';
import PreferencesDialog from './components/PreferencesDialog/PreferencesDialog';
import './components/TooltipStyles.css'; // Import custom tooltip styles
// import ProjectForm from './components/ProjectForm'; // These were incorrectly added in a previous edit
// import ProjectList from './components/ProjectList'; // These were incorrectly added in a previous edit
// import WallpaperSelector from './components/WallpaperSelector'; // These were incorrectly added in a previous edit
// import { wallpapers } from './utils/wallpapers'; // These were incorrectly added in a previous edit
// import './App.css'; // This was fine

import lunr from 'lunr';

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

const AppContent: FC = () => {
    const location = useLocation();
    const [projects, setProjects] = useState<Project[]>([]);
    const [notes, setNotes] = useState<Note[]>([]);
    const [nextProjectId, setNextProjectId] = useState<number>(1);
    const [isPreferencesOpen, setIsPreferencesOpen] = useState<boolean>(false);
    const [appWallpaper, setAppWallpaper] = useState<string | null>(null);
    const [dataLoaded, setDataLoaded] = useState(false);
    // const [initialLoadHasProjects, setInitialLoadHasProjects] = useState<boolean>(false); // THIS WAS THE UNUSED VARIABLE IDENTIFIED IN THE BUILD OUTPUT
    const [globalPeople, setGlobalPeople] = useState<Person[]>(initialGlobalPeople); // New state for people
    const [searchTerm, setSearchTerm] = useState<string>(''); // New state for search
    const [searchIndex, setSearchIndex] = useState<lunr.Index | null>(null);
    // const [isModalOpen, setIsModalOpen] = useState(false); // This was NOT part of the original App.tsx, it was currentProject from the old version
    // const [currentProject, setCurrentProject] = useState<Project | null>(null); // This was NOT part of the original App.tsx
    // const [selectedWallpaper, setSelectedWallpaper] = useState<string>(() => { // This was NOT part of the original App.tsx
    //     return localStorage.getItem('selectedWallpaper') || wallpapers[0].value;
    // });

    useEffect(() => {
        if (projects.length > 0) {
            const idx = lunr(function () {
                this.ref('id');
                this.field('title');
                this.field('tasks');
                console.log('Building search index with projects:', projects);
                projects.forEach((project) => {
                    const data = {
                        id: project.id,
                        title: project.title,
                        tasks: project.tasks
                            .map((task) => {
                                let txt = task.title;
                                if (task.items.length > 0) {
                                    txt += ` ${task.items.map((item) => item.text).join(' ')}`;
                                }
                                return txt;
                            })
                            .join(' ')
                    };
                    console.log('Adding project:', data);
                    this.add(data);
                });
            });
            setSearchIndex(idx);
        }
    }, [projects]);

    // Load initial data from IndexedDB
    useEffect(() => {
        const loadData = async () => {
            try {
                const savedProjects = await idbGet<Project[]>('projectsData');
                const savedNotes = await idbGet<Note[]>('notesData');
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

                if (savedNotes && savedNotes.length > 0) {
                    const parsedNotes = savedNotes.map((n: Note) => ({
                        ...n,
                        creationDate:
                            typeof n.creationDate === 'string'
                                ? n.creationDate
                                : n.creationDate.toISOString(),
                        followUpDate: n.followUpDate
                            ? typeof n.followUpDate === 'string'
                                ? n.followUpDate
                                : n.followUpDate.toISOString()
                            : undefined
                    }));
                    setNotes(parsedNotes);
                } else {
                    setNotes([]);
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
                setNotes([]);
                // setInitialLoadHasProjects(false); // Part of the original unused variable
            } finally {
                setDataLoaded(true);
            }
        };
        loadData();
    }, []);

    // Load notes from backend after initial data is loaded
    useEffect(() => {
        if (dataLoaded) {
            loadNotesFromBackend();
        }
    }, [dataLoaded]);

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

    // Ensure all projects have position values
    useEffect(() => {
        if (dataLoaded && projects.length > 0) {
            const projectsNeedingPosition = projects.filter((p) => !p.position);
            if (projectsNeedingPosition.length > 0) {
                setProjects((prevProjects) =>
                    prevProjects.map((p, index) => ({
                        ...p,
                        position: p.position || index + 1
                    }))
                );
            }
        }
    }, [dataLoaded, projects]);

    const syncData = async () => {
        await syncApi.syncData({ projects, globalPeople, notes });
    };

    const loadNotesFromBackend = async () => {
        const result = await notesApi.getAllNotes();
        if (result.success && result.data && result.data.length > 0) {
            setNotes(result.data);
            // Also save to IndexedDB
            await idbSet('notesData', result.data);
        }
    };

    // Save data to IndexedDB and sync with backend
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

            // Save notes to IndexedDB whenever it changes after initial load
            if (notes.length > 0) {
                idbSet('notesData', notes).catch((error) =>
                    console.error('Failed to save notes to IndexedDB', error)
                );
            } else {
                idbRemove('notesData').catch((error) =>
                    console.error('Failed to remove notesData from IndexedDB', error)
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

        if (dataLoaded) {
            syncData();
        }
    }, [projects, notes, globalPeople, dataLoaded]);

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
            taskColor: getRandomPastelColor(),
            position: projects.length + 1
        };
        setProjects([...projects, newProject]);
        // nextProjectId will update via its own useEffect
    };

    const handleDeleteProject = (projectId: string) => {
        setProjects((prevProjects) => {
            const filtered = prevProjects.filter((p) => p.id !== projectId);
            // Adjust positions after deletion
            return filtered.map((p, index) => ({
                ...p,
                position: index + 1
            }));
        });
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

    const handleUpdateProjectPosition = (projectId: string, newPosition: number) => {
        setProjects((prevProjects) => {
            const updatedProjects = [...prevProjects];
            const projectIndex = updatedProjects.findIndex((p) => p.id === projectId);
            if (projectIndex === -1) return prevProjects;

            const [project] = updatedProjects.splice(projectIndex, 1);
            project.position = newPosition;

            // Insert at the new position
            updatedProjects.splice(newPosition - 1, 0, project);

            // Update positions for all projects to maintain sequence
            return updatedProjects.map((p, index) => ({
                ...p,
                position: index + 1
            }));
        });
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
        setSearchTerm(newSearchTerm);
    };

    const handleAddNote = async (noteData: {
        text: string;
        people: string[];
        followUpDate?: Date;
    }) => {
        const newNote: Note = {
            id: `note-${crypto.randomUUID()}`,
            text: noteData.text,
            people: noteData.people,
            followUpDate: noteData.followUpDate?.toISOString(),
            creationDate: new Date().toISOString()
        };

        // Update local state immediately
        setNotes((prevNotes) => [newNote, ...prevNotes]);

        // Sync with backend
        await notesApi.createNote(newNote);
    };

    const handleUpdateNote = async (updatedNote: Note) => {
        // Update local state immediately
        setNotes((prevNotes) =>
            prevNotes.map((note) => (note.id === updatedNote.id ? updatedNote : note))
        );

        // Sync with backend
        await notesApi.updateNote(updatedNote);
    };

    const handleArchiveNote = async (noteId: string) => {
        // Update local state immediately
        setNotes((prevNotes) =>
            prevNotes.map((note) => (note.id === noteId ? { ...note, isArchived: true } : note))
        );

        // Sync with backend
        const noteToArchive = notes.find((note) => note.id === noteId);
        if (noteToArchive) {
            await notesApi.archiveNote(noteToArchive);
        }
    };

    const handleDeleteNote = async (noteId: string) => {
        // Update local state immediately
        setNotes((prevNotes) => prevNotes.filter((note) => note.id !== noteId));

        // Sync with backend
        await notesApi.deleteNote(noteId);
    };

    const searchedProjects = useMemo(() => {
        if (!searchTerm) {
            return projects;
        }
        if (!searchIndex) {
            return [];
        }

        try {
            const results = searchIndex.search(`*${searchTerm}*`);
            console.log('Search results:', results);
            const projectIds = results.map((result) => result.ref);
            return projects.filter((project) => projectIds.includes(project.id));
        } catch (e) {
            console.error('Search error:', e);
            return [];
        }
    }, [searchTerm, projects, searchIndex]);

    return (
        <>
            <AppHeader
                onOpenPreferences={() => setIsPreferencesOpen(true)}
                onAddProject={handleAddProject}
                onSearchChange={handleSearchChange}
                currentPath={location.pathname}
            />
            <main className={styles.mainContentContainer}>
                <Routes>
                    <Route
                        path='/'
                        element={
                            <div
                                className={
                                    dataLoaded && projects.length === 0 ? styles.centerContent : ''
                                }
                            >
                                {dataLoaded && projects.length === 0 ? (
                                    <div className={styles.noProjectsMessage}>
                                        No projects available. Click the '+' button to add a new
                                        project.
                                    </div>
                                ) : (
                                    searchedProjects
                                        .sort((a, b) => (a.position || 0) - (b.position || 0))
                                        .map((project) => (
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
                                                onUpdateProjectTaskColor={
                                                    handleUpdateProjectTaskColor
                                                }
                                                onUpdateProjectPosition={
                                                    handleUpdateProjectPosition
                                                }
                                                totalProjects={projects.length}
                                                highlightTerm={searchTerm}
                                            />
                                        ))
                                )}
                            </div>
                        }
                    />
                    <Route
                        path='/notes'
                        element={
                            <Notes
                                notes={notes}
                                people={globalPeople}
                                onAddNote={handleAddNote}
                                onUpdateNote={handleUpdateNote}
                                onArchiveNote={handleArchiveNote}
                                onDeleteNote={handleDeleteNote}
                                onFindOrCreatePerson={handleFindOrCreatePerson}
                            />
                        }
                    />
                </Routes>
            </main>
            <PreferencesDialog
                isOpen={isPreferencesOpen}
                onClose={() => setIsPreferencesOpen(false)}
                onWallpaperChange={handleWallpaperChange}
            />
        </>
    );
};

const App: FC = () => {
    return (
        <Router>
            <AppContent />
        </Router>
    );
};

export default App;
