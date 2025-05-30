import React, { useState, useMemo } from 'react';
import type { Project, Task, TaskItem, Person } from '../types'; // Assuming types.ts is in the same src folder
import styles from './ProjectLane.module.css'; // Use CSS module import

interface ProjectLaneProps {
    project: Project;
    people: Person[];
    findOrCreatePerson: (name: string) => string;
    onDeleteProject: (projectId: string) => void;
    onUpdateProjectTitle: (projectId: string, newTitle: string) => void;
    onAddTask: (projectId: string, taskTitle: string) => void;
    onUpdateTask: (
        projectId: string,
        taskId: string,
        updatedTaskData: Partial<Omit<Task, 'id'>>
    ) => void;
    onDeleteTask: (projectId: string, taskId: string) => void;
}

const PREDEFINED_TASK_COLORS = [
    '#FFAB91', // Light Orange
    '#FFCC80', // Orange
    '#FFE082', // Yellow
    '#A5D6A7', // Light Green
    '#80CBC4', // Teal
    '#81D4FA', // Light Blue
    '#90CAF9', // Blue
    '#CE93D8', // Purple
    '#F48FB1', // Pink
    '#E0E0E0' // Grey
];

const ProjectLane: React.FC<ProjectLaneProps> = ({
    project,
    people,
    findOrCreatePerson,
    onDeleteProject,
    onUpdateProjectTitle,
    onAddTask,
    onUpdateTask,
    onDeleteTask
}) => {
    const [isEditingProjectTitle, setIsEditingProjectTitle] = useState(false);
    const [editingProjectTitle, setEditingProjectTitle] = useState(project.title);
    const [newTaskTitle, setNewTaskTitle] = useState('');

    // State for editing individual task titles
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [currentEditingTaskTitle, setCurrentEditingTaskTitle] = useState<string>('');

    // State for adding a new item to a specific task
    const [newItemText, setNewItemText] = useState<{ [taskId: string]: string }>({});

    // State for editing individual task item text
    const [editingItem, setEditingItem] = useState<{ taskId: string; itemId: string } | null>(null);
    const [currentEditingItemText, setCurrentEditingItemText] = useState<string>('');

    // State for person tagging UI
    const [taggingPersonTaskId, setTaggingPersonTaskId] = useState<string | null>(null);
    const [personNameInput, setPersonNameInput] = useState('');
    const [personSuggestions, setPersonSuggestions] = useState<Person[]>([]);

    const [pickingColorForTask, setPickingColorForTask] = useState<string | null>(null); // Task ID

    const handleProjectTitleDoubleClick = () => {
        setIsEditingProjectTitle(true);
        setEditingProjectTitle(project.title);
    };

    const handleProjectTitleEditClick = () => {
        setIsEditingProjectTitle(true);
        setEditingProjectTitle(project.title);
    };

    const handleProjectTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEditingProjectTitle(e.target.value);
    };

    const handleProjectTitleSave = () => {
        if (editingProjectTitle.trim() !== '' && editingProjectTitle !== project.title) {
            onUpdateProjectTitle(project.id, editingProjectTitle.trim());
        }
        setIsEditingProjectTitle(false);
    };

    const handleProjectTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleProjectTitleSave();
        if (e.key === 'Escape') {
            setIsEditingProjectTitle(false);
            setEditingProjectTitle(project.title);
        }
    };

    const handleNewTaskChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewTaskTitle(e.target.value);
    };

    const handleAddNewTask = () => {
        if (newTaskTitle.trim() !== '') {
            onAddTask(project.id, newTaskTitle.trim());
            setNewTaskTitle('');
        }
    };

    // Task Title Editing Handlers
    const handleTaskTitleDoubleClick = (task: Task) => {
        setEditingTaskId(task.id);
        setCurrentEditingTaskTitle(task.title);
    };

    const handleTaskTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCurrentEditingTaskTitle(e.target.value);
    };

    const handleTaskTitleSave = (taskId: string) => {
        if (currentEditingTaskTitle.trim() === '') {
            // Optionally delete if title is cleared, or just revert/do nothing
            // For now, let's just revert if empty to prevent saving empty titles this way.
            const originalTask = project.tasks.find((t) => t.id === taskId);
            if (originalTask) setCurrentEditingTaskTitle(originalTask.title);
            setEditingTaskId(null);
            return;
        }
        const originalTask = project.tasks.find((t) => t.id === taskId);
        if (originalTask && originalTask.title !== currentEditingTaskTitle.trim()) {
            onUpdateTask(project.id, taskId, { title: currentEditingTaskTitle.trim() });
        }
        setEditingTaskId(null);
    };

    const handleTaskTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, taskId: string) => {
        if (e.key === 'Enter') handleTaskTitleSave(taskId);
        if (e.key === 'Escape') {
            const originalTask = project.tasks.find((t) => t.id === taskId);
            if (originalTask) setCurrentEditingTaskTitle(originalTask.title);
            setEditingTaskId(null);
        }
    };

    const handleNewItemChange = (taskId: string, text: string) => {
        setNewItemText((prev) => ({ ...prev, [taskId]: text }));
    };

    const handleAddNewItem = (taskId: string) => {
        const text = newItemText[taskId]?.trim();
        if (!text) return;

        const task = project.tasks.find((t) => t.id === taskId);
        if (!task) return;

        const newItem: TaskItem = {
            id: crypto.randomUUID(),
            text: text,
            completed: false
        };

        const updatedTaskItems = [...task.items, newItem];
        onUpdateTask(project.id, taskId, { items: updatedTaskItems });
        setNewItemText((prev) => ({ ...prev, [taskId]: '' })); // Clear input for this task
    };

    const handleToggleTaskItem = (taskId: string, itemId: string) => {
        const task = project.tasks.find((t) => t.id === taskId);
        if (!task) return;

        const updatedItems = task.items.map((item) =>
            item.id === itemId ? { ...item, completed: !item.completed } : item
        );
        onUpdateTask(project.id, taskId, { items: updatedItems });
    };

    // Task Item Editing and Deletion Handlers
    const handleItemTextDoubleClick = (task: Task, item: TaskItem) => {
        setEditingItem({ taskId: task.id, itemId: item.id });
        setCurrentEditingItemText(item.text);
    };

    const handleItemTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCurrentEditingItemText(e.target.value);
    };

    const handleItemTextSave = () => {
        if (!editingItem) return;
        const { taskId, itemId } = editingItem;

        if (currentEditingItemText.trim() === '') {
            // If text is empty, delete the item
            handleDeleteItem(taskId, itemId);
            setEditingItem(null);
            return;
        }

        const task = project.tasks.find((t) => t.id === taskId);
        if (!task) return;
        const originalItem = task.items.find((i) => i.id === itemId);

        if (originalItem && originalItem.text !== currentEditingItemText.trim()) {
            const updatedItems = task.items.map((i) =>
                i.id === itemId ? { ...i, text: currentEditingItemText.trim() } : i
            );
            onUpdateTask(project.id, taskId, { items: updatedItems });
        }
        setEditingItem(null);
    };

    const handleItemTextKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleItemTextSave();
        if (e.key === 'Escape') {
            if (editingItem) {
                const task = project.tasks.find((t) => t.id === editingItem.taskId);
                const originalItem = task?.items.find((i) => i.id === editingItem.itemId);
                if (originalItem) setCurrentEditingItemText(originalItem.text);
            }
            setEditingItem(null);
        }
    };

    const handleDeleteItem = (taskId: string, itemId: string) => {
        const task = project.tasks.find((t) => t.id === taskId);
        if (!task) return;
        const updatedItems = task.items.filter((i) => i.id !== itemId);
        onUpdateTask(project.id, taskId, { items: updatedItems });
    };

    // Person Tagging Handlers
    const handleOpenPersonTagging = (taskId: string) => {
        setTaggingPersonTaskId(taskId);
        setPersonNameInput('');
        setPersonSuggestions([]);
    };

    const handlePersonNameInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.value;
        setPersonNameInput(name);
        if (name.trim().length > 0) {
            const lowerCaseName = name.toLowerCase();
            setPersonSuggestions(
                people.filter((p) => p.name.toLowerCase().includes(lowerCaseName))
            );
        } else {
            setPersonSuggestions([]);
        }
    };

    const handleAssignPerson = (taskId: string, personId: string) => {
        const task = project.tasks.find((t) => t.id === taskId);
        if (task && !task.assignedPersons.includes(personId)) {
            const updatedPersons = [...task.assignedPersons, personId];
            onUpdateTask(project.id, taskId, { assignedPersons: updatedPersons });
        }
        // Close tagging UI after assignment
        setTaggingPersonTaskId(null);
        setPersonNameInput('');
        setPersonSuggestions([]);
    };

    const handleCreateAndAssignPerson = (taskId: string) => {
        if (personNameInput.trim() === '') return;
        const personId = findOrCreatePerson(personNameInput.trim());
        handleAssignPerson(taskId, personId);
    };

    const handleRemovePersonFromTask = (taskId: string, personId: string) => {
        const task = project.tasks.find((t) => t.id === taskId);
        if (task) {
            const updatedPersons = task.assignedPersons.filter((id) => id !== personId);
            onUpdateTask(project.id, taskId, { assignedPersons: updatedPersons });
        }
    };

    const getAssignedPeopleDetails = useMemo(() => {
        return (taskId: string) => {
            const task = project.tasks.find((t) => t.id === taskId);
            if (!task) return [];
            return task.assignedPersons
                .map((personId) => people.find((p) => p.id === personId))
                .filter(Boolean) as Person[];
        };
    }, [project.tasks, people]);

    const handleReminderChange = async (
        taskId: string,
        taskTitle: string,
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const reminderValue = e.target.value;
        if (reminderValue) {
            const reminderDate = new Date(reminderValue);
            const isoString = reminderDate.toISOString();
            // First, update the task state locally and save it
            onUpdateTask(project.id, taskId, { reminder: isoString });

            // Then, try to schedule the notification
            try {
                const result = await window.electronAPI.scheduleNotification({
                    title: `${project.title}: ${taskTitle}`,
                    body: 'Reminder for your task.', // Or allow custom message later
                    taskDate: isoString // Send ISO string to main process
                });
                if (result.success) {
                    console.log('Notification scheduled/shown:', result.message);
                    // Optionally provide feedback to the user, e.g., a small toast message
                } else {
                    console.error('Failed to schedule notification:', result.error);
                    // Optionally show an error to the user in the UI if scheduling fails
                    // alert(`Could not schedule reminder: ${result.error}`);
                }
            } catch (err) {
                console.error('Error calling scheduleNotification IPC:', err);
                // alert('An error occurred while trying to set the reminder.');
            }
        } else {
            onUpdateTask(project.id, taskId, { reminder: undefined }); // Clear reminder
            // If we had a way to cancel notifications by ID, we would do it here.
            console.log('Reminder cleared for task:', taskId);
        }
    };

    const handleSetTaskColor = (taskId: string, color?: string) => {
        onUpdateTask(project.id, taskId, { color: color });
        setPickingColorForTask(null); // Close color picker
    };

    const toggleColorPicker = (taskId: string) => {
        setPickingColorForTask(pickingColorForTask === taskId ? null : taskId);
    };

    const renderTaskItem = (task: Task, item: TaskItem, isCompletedList: boolean) => (
        <div
            key={item.id}
            className={`${styles.taskItem} ${isCompletedList ? styles.completedTaskItem : ''}`}
        >
            <input
                type='checkbox'
                checked={item.completed}
                onChange={() => handleToggleTaskItem(task.id, item.id)}
                className={styles.taskItemCheckbox}
            />
            {editingItem && editingItem.taskId === task.id && editingItem.itemId === item.id ? (
                <input
                    type='text'
                    value={currentEditingItemText}
                    onChange={handleItemTextChange}
                    onBlur={handleItemTextSave}
                    onKeyDown={handleItemTextKeyDown}
                    autoFocus
                    className={styles.taskItemTextInput}
                />
            ) : (
                <span
                    className={`${styles.taskItemText} ${
                        item.completed ? styles.completedItemText : ''
                    }`}
                    onDoubleClick={() => handleItemTextDoubleClick(task, item)}
                >
                    {item.text}
                </span>
            )}
            <button
                onClick={() => handleDeleteItem(task.id, item.id)}
                className={styles.deleteItemBtn}
            >
                ×
            </button>
        </div>
    );

    return (
        <div className={styles.projectLaneContainer} style={{ borderColor: project.taskColor }}>
            <div className={styles.projectHeader}>
                {isEditingProjectTitle ? (
                    <input
                        type='text'
                        value={editingProjectTitle}
                        onChange={handleProjectTitleChange}
                        onBlur={handleProjectTitleSave}
                        onKeyDown={handleProjectTitleKeyDown}
                        autoFocus
                        className={styles.projectTitleInput}
                    />
                ) : (
                    <div className={styles.projectTitleContainer}>
                        <h2
                            onDoubleClick={handleProjectTitleDoubleClick}
                            className={styles.projectTitle}
                        >
                            {project.title}
                        </h2>
                        <button
                            onClick={handleProjectTitleEditClick}
                            className={styles.editProjectBtn}
                            title='Edit project name'
                        >
                            ✏️
                        </button>
                    </div>
                )}
                <button
                    onClick={() => onDeleteProject(project.id)}
                    className={styles.deleteProjectBtn}
                >
                    ✕
                </button>
            </div>

            <div className={styles.addTaskForm}>
                <input
                    type='text'
                    value={newTaskTitle}
                    onChange={handleNewTaskChange}
                    placeholder='New task title...'
                    className={styles.newTaskInput}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddNewTask()}
                />
                <button onClick={handleAddNewTask} className={styles.addTaskBtn}>
                    + Add Task
                </button>
            </div>

            <div className={styles.taskList}>
                {project.tasks.map((task) => {
                    const assignedPeopleDetails = getAssignedPeopleDetails(task.id);
                    const reminderValueForInput = task.reminder
                        ? new Date(task.reminder).toISOString().substring(0, 16)
                        : '';
                    const currentTaskColor = task.color || project.taskColor; // Use task color if set, else project color

                    return (
                        <div
                            key={task.id}
                            className={styles.taskCard}
                            style={{ backgroundColor: currentTaskColor }}
                        >
                            <div className={styles.taskHeader}>
                                {editingTaskId === task.id ? (
                                    <input
                                        type='text'
                                        value={currentEditingTaskTitle}
                                        onChange={handleTaskTitleChange}
                                        onBlur={() => handleTaskTitleSave(task.id)}
                                        onKeyDown={(e) => handleTaskTitleKeyDown(e, task.id)}
                                        autoFocus
                                        className={styles.taskTitleInput}
                                    />
                                ) : (
                                    <p
                                        className={styles.taskTitle}
                                        onDoubleClick={() => handleTaskTitleDoubleClick(task)}
                                    >
                                        {task.title}
                                    </p>
                                )}
                                <button
                                    onClick={() => onDeleteTask(project.id, task.id)}
                                    className={styles.deleteTaskBtn}
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Task Items */}
                            <div className={styles.taskItemsContainer}>
                                {task.items
                                    .filter((item) => !item.completed)
                                    .map((item) => renderTaskItem(task, item, false))}
                            </div>

                            {/* Completed Items Section */}
                            {task.items.some((i) => i.completed) && (
                                <details className={styles.completedSectionDetails} open={false}>
                                    <summary className={styles.completedSectionSummary}>
                                        Completed ({task.items.filter((i) => i.completed).length})
                                    </summary>
                                    <div className={styles.completedItemsContainer}>
                                        {task.items
                                            .filter((item) => item.completed)
                                            .map((item) => renderTaskItem(task, item, true))}
                                    </div>
                                </details>
                            )}

                            {/* Add New Task Item Form */}
                            <div className={styles.addItemForm}>
                                <input
                                    type='text'
                                    placeholder='Add item...'
                                    value={newItemText[task.id] || ''}
                                    onChange={(e) => handleNewItemChange(task.id, e.target.value)}
                                    onKeyDown={(e) =>
                                        e.key === 'Enter' && handleAddNewItem(task.id)
                                    }
                                    className={styles.addItemInput}
                                />
                                <button
                                    onClick={() => handleAddNewItem(task.id)}
                                    className={styles.addItemBtn}
                                >
                                    +
                                </button>
                            </div>

                            {/* Person Tagging UI */}
                            <div className={styles.taskFooter}>
                                <div className={styles.assignedPeopleContainer}>
                                    {assignedPeopleDetails.slice(0, 5).map((person) => (
                                        <span
                                            key={person.id}
                                            className={styles.personAvatar}
                                            title={person.name}
                                            onClick={() =>
                                                handleRemovePersonFromTask(task.id, person.id)
                                            }
                                        >
                                            {person.initials}
                                        </span>
                                    ))}
                                    {assignedPeopleDetails.length > 5 && (
                                        <span
                                            className={`${styles.personAvatar} ${styles.overflowAvatar}`}
                                        >
                                            +{assignedPeopleDetails.length - 5}
                                        </span>
                                    )}
                                    <button
                                        onClick={() => handleOpenPersonTagging(task.id)}
                                        className={styles.addPersonBtn}
                                    >
                                        + Person
                                    </button>
                                </div>

                                {taggingPersonTaskId === task.id && (
                                    <div className={styles.personTaggingPopup}>
                                        <input
                                            type='text'
                                            placeholder="Person's name..."
                                            value={personNameInput}
                                            onChange={handlePersonNameInputChange}
                                            onKeyDown={(e) =>
                                                e.key === 'Enter' &&
                                                handleCreateAndAssignPerson(task.id)
                                            }
                                            className={styles.personNameInput}
                                            autoFocus
                                        />
                                        {personSuggestions.length > 0 && (
                                            <ul className={styles.personSuggestionsList}>
                                                {personSuggestions.map((p) => (
                                                    <li
                                                        key={p.id}
                                                        onClick={() =>
                                                            handleAssignPerson(task.id, p.id)
                                                        }
                                                    >
                                                        {p.name}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                        <button
                                            onClick={() => handleCreateAndAssignPerson(task.id)}
                                            className={styles.confirmAddPersonBtn}
                                        >
                                            Add/Assign
                                        </button>
                                        <button
                                            onClick={() => setTaggingPersonTaskId(null)}
                                            className={styles.cancelAddPersonBtn}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                )}

                                {/* Reminder Input */}
                                <div className={styles.reminderContainer}>
                                    <label
                                        htmlFor={`reminder-${task.id}`}
                                        className={styles.reminderLabel}
                                    >
                                        Reminder:
                                    </label>
                                    <input
                                        type='datetime-local'
                                        id={`reminder-${task.id}`}
                                        value={reminderValueForInput}
                                        onChange={(e) =>
                                            handleReminderChange(task.id, task.title, e)
                                        }
                                        className={styles.reminderInput}
                                    />
                                    {task.reminder && (
                                        <button
                                            onClick={() =>
                                                onUpdateTask(project.id, task.id, {
                                                    reminder: undefined
                                                })
                                            }
                                            className={styles.clearReminderBtn}
                                            title='Clear reminder'
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>

                                {/* Task Color Picker Button and Palette */}
                                <div className={styles.taskActionsContainer}>
                                    <div className={styles.colorPickerContainer}>
                                        <button
                                            onClick={() => toggleColorPicker(task.id)}
                                            className={styles.taskColorPickerButton}
                                            title='Change task color'
                                            style={{ backgroundColor: currentTaskColor }}
                                        >
                                            🎨
                                        </button>
                                        {pickingColorForTask === task.id && (
                                            <div className={styles.colorPalette}>
                                                <button
                                                    onClick={() =>
                                                        handleSetTaskColor(task.id, undefined)
                                                    }
                                                    className={`${styles.colorOption} ${styles.noColorOption}`}
                                                    title='Revert to project color'
                                                >
                                                    ✕
                                                </button>
                                                {PREDEFINED_TASK_COLORS.map((color) => (
                                                    <button
                                                        key={color}
                                                        onClick={() =>
                                                            handleSetTaskColor(task.id, color)
                                                        }
                                                        className={styles.colorOption}
                                                        style={{ backgroundColor: color }}
                                                        title={color}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
                {project.tasks.length === 0 && (
                    <p className={styles.noTasksMessage}>No tasks yet. Add one below!</p>
                )}
            </div>
        </div>
    );
};

export default ProjectLane;
