import { useState, useEffect, useCallback } from 'react';
import type { Project, Task, Person } from './types';
import ProjectLane from './components/ProjectLane'; // Import ProjectLane
import styles from './App.module.css'; // Using App.module.css for app-level styles

function App() {
    const [projectDataPath, setProjectDataPath] = useState<string | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [people, setPeople] = useState<Person[]>([]);
    const [isLoadingPeople, setIsLoadingPeople] = useState(true);
    // Editing state is now managed within ProjectLane

    useEffect(() => {
        const cleanup = window?.electronAPI?.onSetProjectDataPath((path) => {
            console.log('Received project data path:', path);
            setProjectDataPath(path);
        });
        return cleanup;
    }, []);

    const saveData = useCallback(
        async (updatedProjects: Project[]) => {
            if (projectDataPath) {
                try {
                    const result = await window?.electronAPI?.saveProjects(updatedProjects);
                    if (!result.success) {
                        console.error('Failed to save projects:', result.error);
                        setError('Failed to save projects. Some changes might not persist.');
                    }
                } catch (err) {
                    console.error('Error in saveProjects IPC call:', err);
                    setError('Error communicating with main process to save projects.');
                }
            }
        },
        [projectDataPath]
    );

    const savePeopleData = useCallback(
        async (updatedPeople: Person[]) => {
            if (projectDataPath) {
                try {
                    const result = await window?.electronAPI?.savePeople(updatedPeople);
                    if (!result.success) {
                        console.error('Failed to save people:', result.error);
                        // Optionally set an error state for people saving
                    }
                } catch (err) {
                    console.error('Error in savePeople IPC call:', err);
                }
            }
        },
        [projectDataPath]
    );

    useEffect(() => {
        if (projectDataPath) {
            setIsLoading(true);
            setError(null);
            window?.electronAPI
                ?.loadProjects()
                .then((loadedProjects) => {
                    console.log('Loaded projects:', loadedProjects);
                    setProjects(loadedProjects || []);
                })
                .catch((err) => {
                    console.error('Error loading projects:', err);
                    setError('Failed to load projects. Check console for details.');
                    setProjects([]);
                })
                .finally(() => {
                    setIsLoading(false);
                });

            setIsLoadingPeople(true);
            window?.electronAPI
                ?.loadPeople()
                .then((loadedPeople) => {
                    console.log('Loaded people:', loadedPeople);
                    setPeople(loadedPeople || []);
                })
                .catch((err) => {
                    console.error('Failed to load people:', err);
                    // Optionally set an error state for people loading
                    setPeople([]);
                })
                .finally(() => {
                    setIsLoadingPeople(false);
                });
        }
    }, [projectDataPath]);

    const handleAddProject = () => {
        const newProject: Project = {
            id: crypto.randomUUID(),
            title: `New Project ${projects.length + 1}`,
            tasks: [],
            taskColor: getRandomPastelColor()
        };
        const updatedProjects = [...projects, newProject];
        setProjects(updatedProjects);
        saveData(updatedProjects);
    };

    const handleDeleteProject = (projectId: string) => {
        const updatedProjects = projects.filter((p) => p.id !== projectId);
        setProjects(updatedProjects);
        saveData(updatedProjects);
    };

    const handleUpdateProjectTitle = (projectId: string, newTitle: string) => {
        const updatedProjects = projects.map((p) =>
            p.id === projectId ? { ...p, title: newTitle } : p
        );
        setProjects(updatedProjects);
        saveData(updatedProjects);
    };

    const getRandomPastelColor = () => {
        const hue = Math.floor(Math.random() * 360);
        return `hsl(${hue}, 70%, 80%)`;
    };

    // Task Management Functions
    const handleAddTask = (projectId: string, taskTitle: string) => {
        const newTask: Task = {
            id: crypto.randomUUID(),
            title: taskTitle,
            items: [],
            assignedPersons: []
            // reminder: undefined, // No reminder by default
            // color: undefined, // Inherits project color by default
        };
        const updatedProjects = projects.map((p) =>
            p.id === projectId ? { ...p, tasks: [...p.tasks, newTask] } : p
        );
        setProjects(updatedProjects);
        saveData(updatedProjects);
    };

    const handleUpdateTask = (
        projectId: string,
        taskId: string,
        updatedTaskData: Partial<Omit<Task, 'id'>>
    ) => {
        const updatedProjects = projects.map((p) => {
            if (p.id === projectId) {
                return {
                    ...p,
                    tasks: p.tasks.map((t) => (t.id === taskId ? { ...t, ...updatedTaskData } : t))
                };
            }
            return p;
        });
        setProjects(updatedProjects);
        saveData(updatedProjects);
    };

    const handleDeleteTask = (projectId: string, taskId: string) => {
        const updatedProjects = projects.map((p) => {
            if (p.id === projectId) {
                return { ...p, tasks: p.tasks.filter((t) => t.id !== taskId) };
            }
            return p;
        });
        setProjects(updatedProjects);
        saveData(updatedProjects);
    };

    // Person Management
    const getPersonInitials = (name: string): string => {
        const parts = name.split(' ').filter(Boolean);
        if (parts.length === 0) return '?';
        if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
        return (parts[0][0] + (parts[parts.length - 1][0] || '')).toUpperCase();
    };

    // This function will be called from the Person Tagging UI
    // It ensures a person exists and returns their ID, creating them if new.
    const findOrCreatePerson = (name: string): string => {
        const existingPerson = people.find((p) => p.name.toLowerCase() === name.toLowerCase());
        if (existingPerson) {
            return existingPerson.id;
        }
        const newPerson: Person = {
            id: crypto.randomUUID(),
            name: name,
            initials: getPersonInitials(name)
        };
        const updatedPeople = [...people, newPerson];
        setPeople(updatedPeople);
        savePeopleData(updatedPeople);
        return newPerson.id;
    };

    if (!projectDataPath && (isLoading || isLoadingPeople)) {
        return <div className={styles.centeredMessage}>Waiting for project data path...</div>;
    }
    if (!projectDataPath && !isLoading && !isLoadingPeople) {
        return (
            <div className={styles.centeredMessage}>Project data path not set. Please restart.</div>
        );
    }
    if ((isLoading || isLoadingPeople) && projectDataPath) {
        return <div className={styles.centeredMessage}>Loading data from {projectDataPath}...</div>;
    }
    if (error) {
        return (
            <div className={`${styles.centeredMessage} ${styles.errorText}`}>Error: {error}</div>
        );
    }

    return (
        <div className={styles.appContainer}>
            <header className={styles.appHeader}>
                <h1>TrueTrack!</h1>
                <button onClick={handleAddProject} className={styles.addProjectBtn}>
                    Add New Project
                </button>
                {/* projectDataPath && (
                    <p className={styles.dataPathDisplay}>Data Path: {projectDataPath}</p>
                ) */}
            </header>
            <main className={styles.projectsGrid}>
                {projects.length === 0 && !isLoading && (
                    <p className={styles.centeredMessage}>
                        No projects found. Click "Add New Project" to get started!
                    </p>
                )}
                {projects.map((project) => (
                    <ProjectLane
                        key={project.id}
                        project={project}
                        people={people}
                        findOrCreatePerson={findOrCreatePerson}
                        onDeleteProject={handleDeleteProject}
                        onUpdateProjectTitle={handleUpdateProjectTitle}
                        onAddTask={handleAddTask}
                        onUpdateTask={handleUpdateTask}
                        onDeleteTask={handleDeleteTask}
                    />
                ))}
            </main>
        </div>
    );
}

export default App;
