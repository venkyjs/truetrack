import React, { useState, useMemo, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import type { Project, Task, TaskItem, Person } from '../types'; // Assuming types.ts is in the same src folder
import styles from './ProjectLane.module.css'; // Use CSS module import
import classNames from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faEdit,
    faTrashAlt,
    faPlus,
    faTimes,
    faPalette,
    faTag,
    faBell,
    faBellSlash,
    faCalendarAlt,
    faGripVertical
} from '@fortawesome/free-solid-svg-icons';
import Tippy from '@tippyjs/react';
import DateTimePicker from 'react-datetime-picker';
import 'react-datetime-picker/dist/DateTimePicker.css';
import { Calendar } from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import 'react-clock/dist/Clock.css';
import { format } from 'date-fns'; // For formatting the date
import { HexColorPicker } from 'react-colorful';
import Highlight from './Highlight/Highlight';

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
    onUpdateProjectTaskColor: (projectId: string, color?: string) => void;
    rowHeight: number;
    onHeightChange: (projectId: string, newHeight: number) => void;
    searchQuery: string;
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
    '#B0BEC5' // Light Grey instead of E0E0E0 for better contrast
];

const ProjectLane: React.FC<ProjectLaneProps> = ({
    project,
    people,
    findOrCreatePerson,
    onDeleteProject,
    onUpdateProjectTitle,
    onAddTask,
    onUpdateTask,
    onDeleteTask,
    onUpdateProjectTaskColor,
    rowHeight,
    onHeightChange,
    searchQuery
}) => {
    const laneRef = useRef<HTMLDivElement>(null);
    const lastNotifiedHeight = useRef<number | null>(null);

    useEffect(() => {
        if (!laneRef.current) return;

        const observer = new ResizeObserver((entries) => {
            for (let entry of entries) {
                const newPixelHeight = entry.contentRect.height;
                const newGridHeight = Math.ceil(newPixelHeight / rowHeight);

                if (lastNotifiedHeight.current !== newGridHeight) {
                    onHeightChange(project.id, newGridHeight);
                    lastNotifiedHeight.current = newGridHeight;
                }
            }
        });

        observer.observe(laneRef.current);

        return () => observer.disconnect();
    }, [project.id, onHeightChange, rowHeight]);

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

    const [showCompleted, setShowCompleted] = useState<{ [taskId: string]: boolean }>({});

    const [editingReminderTaskId, setEditingReminderTaskId] = useState<string | null>(null);

    const [showColorPicker, setShowColorPicker] = useState(false);

    const [calendarOpenForTaskId, setCalendarOpenForTaskId] = useState<string | null>(null);
    const [calendarPosition, setCalendarPosition] = useState({ top: 0, left: 0 });
    const calendarButtonRef = useRef<HTMLButtonElement>(null);
    const calendarRef = useRef<HTMLDivElement>(null);

    const colorPickerPopoverRef = useRef<HTMLDivElement>(null);
    const colorPickerButtonRef = useRef<HTMLButtonElement>(null);
    const [colorPickerPosition, setColorPickerPosition] = useState({ top: 0, left: 0 });

    useEffect(() => {
        if (taggingPersonTaskId && personNameInput) {
            setPersonSuggestions(
                people.filter((p) => p.name.toLowerCase().includes(personNameInput.toLowerCase()))
            );
        } else {
            setPersonSuggestions([]);
        }
    }, [personNameInput, people, taggingPersonTaskId]);

    const handleProjectTitleDoubleClick = () => {
        setIsEditingProjectTitle(true);
        setEditingProjectTitle(project.title);
    };

    const handleProjectTitleEditClick = (e: React.MouseEvent) => {
        e.stopPropagation();
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

    const handleAddNewTask = (e: React.FormEvent) => {
        e.preventDefault();
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

    const handleAddNewItem = (e: React.FormEvent, taskId: string) => {
        e.preventDefault();
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

        const task = project.tasks.find((t) => t.id === taskId);
        if (!task) return;

        const originalItem = task.items.find((i) => i.id === itemId);
        if (
            originalItem &&
            currentEditingItemText.trim() !== '' &&
            currentEditingItemText !== originalItem.text
        ) {
            const updatedItems = task.items.map((item) =>
                item.id === itemId ? { ...item, text: currentEditingItemText.trim() } : item
            );
            onUpdateTask(project.id, taskId, { items: updatedItems });
        }
        setEditingItem(null);
    };

    const handleItemTextKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleItemTextSave();
        if (e.key === 'Escape') setEditingItem(null);
    };

    const handleDeleteItem = (taskId: string, itemId: string) => {
        const task = project.tasks.find((t) => t.id === taskId);
        if (!task) return;
        const updatedItems = task.items.filter((item) => item.id !== itemId);
        onUpdateTask(project.id, taskId, { items: updatedItems });
    };

    // Person Tagging
    const handleOpenPersonTagging = (taskId: string) => {
        setTaggingPersonTaskId(taskId);
        setPersonNameInput('');
        setPersonSuggestions([]);
    };

    const handlePersonNameInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPersonNameInput(e.target.value);
    };

    const handleAssignPerson = (taskId: string, personId: string) => {
        const task = project.tasks.find((t) => t.id === taskId);
        if (!task) return;

        if (!task.assignedPersons.includes(personId)) {
            const updatedAssignedPersons = [...task.assignedPersons, personId];
            onUpdateTask(project.id, taskId, { assignedPersons: updatedAssignedPersons });
        }
        setTaggingPersonTaskId(null); // Close tagging UI
    };

    const handleCreateAndAssignPerson = (taskId: string) => {
        const newPersonId = findOrCreatePerson(personNameInput);
        handleAssignPerson(taskId, newPersonId);
    };

    const handleRemovePersonFromTask = (taskId: string, personId: string) => {
        const task = project.tasks.find((t) => t.id === taskId);
        if (!task) return;
        const updatedAssignedPersons = task.assignedPersons.filter((id) => id !== personId);
        onUpdateTask(project.id, taskId, { assignedPersons: updatedAssignedPersons });
    };

    const getPersonById = (personId: string) => people.find((p) => p.id === personId);
    const MAX_VISIBLE_AVATARS = 3;

    // Reminder Handlers
    const handleReminderIconClick = (task: Task) => {
        setEditingReminderTaskId(task.id === editingReminderTaskId ? null : task.id);
    };

    const handleReminderChange = (date: Date | null, taskId: string, shouldKeepOpen?: boolean) => {
        const isoDate = date ? date.toISOString() : undefined;
        onUpdateTask(project.id, taskId, { reminder: isoDate });
        if (!shouldKeepOpen) {
            setEditingReminderTaskId(null);
        }
    };

    const handleClearReminder = (taskId: string) => {
        onUpdateTask(project.id, taskId, { reminder: undefined });
        setEditingReminderTaskId(null);
    };

    const handleSetProjectTaskColor = (color?: string) => {
        onUpdateProjectTaskColor(project.id, color);
        setShowColorPicker(false);
    };

    // Close popovers when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                calendarRef.current &&
                !calendarRef.current.contains(event.target as Node) &&
                calendarButtonRef.current &&
                !calendarButtonRef.current.contains(event.target as Node)
            ) {
                setCalendarOpenForTaskId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                colorPickerPopoverRef.current &&
                !colorPickerPopoverRef.current.contains(event.target as Node) &&
                colorPickerButtonRef.current &&
                !colorPickerButtonRef.current.contains(event.target as Node)
            ) {
                setShowColorPicker(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleShowCompleted = (taskId: string) => {
        setShowCompleted((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
    };

    const sortedTasks = useMemo(() => {
        // This sorting can be customized further, e.g., by creation date if available
        return [...project.tasks].sort((a, b) => a.title.localeCompare(b.title));
    }, [project.tasks]);

    const renderTaskItem = (task: Task, item: TaskItem, isCompletedList: boolean) => (
        <li
            key={item.id}
            className={classNames(styles.taskItem, {
                [styles.completed]: item.completed,
                [styles.visible]: !item.completed || isCompletedList
            })}
            onDoubleClick={() => handleItemTextDoubleClick(task, item)}
        >
            <input
                type='checkbox'
                checked={item.completed}
                onChange={() => handleToggleTaskItem(task.id, item.id)}
                className={styles.checkbox}
            />
            {editingItem?.itemId === item.id && editingItem.taskId === task.id ? (
                <input
                    type='text'
                    value={currentEditingItemText}
                    onChange={handleItemTextChange}
                    onBlur={handleItemTextSave}
                    onKeyDown={handleItemTextKeyDown}
                    className={styles.itemEditInput}
                    autoFocus
                />
            ) : (
                <span className={styles.itemText}>
                    <Highlight text={item.text} highlight={searchQuery} />
                </span>
            )}
            <Tippy content='Delete Item' placement='right'>
                <button
                    onClick={() => handleDeleteItem(task.id, item.id)}
                    className={styles.deleteItemButton}
                >
                    <FontAwesomeIcon icon={faTimes} />
                </button>
            </Tippy>
        </li>
    );

    return (
        <div ref={laneRef} className={styles.projectLane}>
            <header className={styles.projectHeader}>
                <div className={classNames(styles.dragHandle, 'project-drag-handle')}>
                    <FontAwesomeIcon icon={faGripVertical} />
                </div>
                {isEditingProjectTitle ? (
                    <input
                        type='text'
                        value={editingProjectTitle}
                        onChange={handleProjectTitleChange}
                        onBlur={handleProjectTitleSave}
                        onKeyDown={handleProjectTitleKeyDown}
                        className={styles.projectTitleInput}
                        autoFocus
                    />
                ) : (
                    <h2
                        className={styles.projectTitle}
                        onDoubleClick={handleProjectTitleDoubleClick}
                        title='Double-click to edit'
                    >
                        <Highlight text={project.title} highlight={searchQuery} />
                    </h2>
                )}
                <div className={styles.projectControls}>
                    <Tippy content='Edit Title' placement='top'>
                        <button
                            onClick={handleProjectTitleEditClick}
                            className={styles.controlButton}
                        >
                            <FontAwesomeIcon icon={faEdit} />
                        </button>
                    </Tippy>
                    <Tippy content='Project Settings' placement='top'>
                        <button
                            ref={colorPickerButtonRef}
                            onClick={(e) => {
                                e.stopPropagation();
                                const rect = e.currentTarget.getBoundingClientRect();
                                setColorPickerPosition({
                                    top: rect.bottom + window.scrollY,
                                    left: rect.left + window.scrollX
                                });
                                setShowColorPicker(!showColorPicker);
                            }}
                            className={styles.controlButton}
                        >
                            <FontAwesomeIcon icon={faPalette} />
                        </button>
                    </Tippy>

                    {showColorPicker &&
                        ReactDOM.createPortal(
                            <div
                                ref={colorPickerPopoverRef}
                                className={styles.colorPickerPopover}
                                style={{
                                    position: 'absolute',
                                    top: `${colorPickerPosition.top}px`,
                                    left: `${colorPickerPosition.left}px`
                                }}
                                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
                            >
                                <div className={styles.colorPickerWrap}>
                                    <HexColorPicker
                                        color={project.taskColor}
                                        onChange={handleSetProjectTaskColor}
                                    />
                                    <div className={styles.predefinedColors}>
                                        {PREDEFINED_TASK_COLORS.map((color) => (
                                            <button
                                                key={color}
                                                className={styles.predefinedColor}
                                                style={{ backgroundColor: color }}
                                                onClick={() => handleSetProjectTaskColor(color)}
                                            />
                                        ))}
                                    </div>
                                    <button
                                        className={styles.resetColorButton}
                                        onClick={() => handleSetProjectTaskColor(undefined)}
                                    >
                                        Reset to Default
                                    </button>
                                </div>
                            </div>,
                            document.body
                        )}
                    <Tippy content='Delete Project' placement='top'>
                        <button
                            onClick={() => onDeleteProject(project.id)}
                            className={styles.controlButton}
                        >
                            <FontAwesomeIcon icon={faTrashAlt} />
                        </button>
                    </Tippy>
                </div>
            </header>

            <div className={styles.tasksContainer}>
                {sortedTasks.map((task) => {
                    const completedItems = task.items.filter((item) => item.completed);
                    const incompleteItems = task.items.filter((item) => !item.completed);
                    const assignedPeople = task.assignedPersons
                        .map(getPersonById)
                        .filter((p): p is Person => p !== undefined);
                    const reminderDate = task.reminder ? new Date(task.reminder) : null;
                    const isReminderSet = reminderDate !== null;

                    return (
                        <div key={task.id} className={styles.taskCard}>
                            <div
                                className={styles.taskTitleContainer}
                                onDoubleClick={() => handleTaskTitleDoubleClick(task)}
                                title='Double-click to edit task title'
                            >
                                {editingTaskId === task.id ? (
                                    <input
                                        type='text'
                                        value={currentEditingTaskTitle}
                                        onChange={handleTaskTitleChange}
                                        onBlur={() => handleTaskTitleSave(task.id)}
                                        onKeyDown={(e) => handleTaskTitleKeyDown(e, task.id)}
                                        className={styles.taskTitleInput}
                                        autoFocus
                                    />
                                ) : (
                                    <h3
                                        style={{
                                            color: task.color || project.taskColor || '#333'
                                        }}
                                    >
                                        <Highlight text={task.title} highlight={searchQuery} />
                                    </h3>
                                )}
                            </div>
                            <div className={styles.taskControls}>
                                <Tippy content='Tag Person' placement='top'>
                                    <button
                                        onClick={() => handleOpenPersonTagging(task.id)}
                                        className={styles.taskControlButton}
                                    >
                                        <FontAwesomeIcon icon={faTag} />
                                    </button>
                                </Tippy>

                                <Tippy
                                    content={
                                        isReminderSet
                                            ? `Reminder: ${format(reminderDate as Date, 'PPP p')}`
                                            : 'Set Reminder'
                                    }
                                    placement='top'
                                >
                                    <button
                                        ref={calendarButtonRef}
                                        onClick={(e) => {
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            setCalendarPosition({
                                                top: rect.bottom + window.scrollY,
                                                left: rect.left + window.scrollX
                                            });
                                            setCalendarOpenForTaskId(
                                                task.id === calendarOpenForTaskId ? null : task.id
                                            );
                                        }}
                                        className={classNames(styles.taskControlButton, {
                                            [styles.reminderSet]: isReminderSet
                                        })}
                                    >
                                        <FontAwesomeIcon icon={faCalendarAlt} />
                                    </button>
                                </Tippy>
                                {calendarOpenForTaskId === task.id &&
                                    ReactDOM.createPortal(
                                        <div
                                            ref={calendarRef}
                                            style={{
                                                position: 'absolute',
                                                top: `${calendarPosition.top}px`,
                                                left: `${calendarPosition.left}px`,
                                                zIndex: 1050
                                            }}
                                        >
                                            <div className={styles.calendarContainer}>
                                                <Calendar
                                                    onChange={(value) =>
                                                        handleReminderChange(value as Date, task.id)
                                                    }
                                                    value={reminderDate}
                                                />
                                                <button
                                                    onClick={() => handleClearReminder(task.id)}
                                                >
                                                    Clear Reminder
                                                </button>
                                            </div>
                                        </div>,
                                        document.body
                                    )}

                                <Tippy content='Delete Task' placement='top'>
                                    <button
                                        onClick={() => onDeleteTask(project.id, task.id)}
                                        className={styles.taskControlButton}
                                    >
                                        <FontAwesomeIcon icon={faTrashAlt} />
                                    </button>
                                </Tippy>
                            </div>

                            {taggingPersonTaskId === task.id && (
                                <div className={styles.personTagging}>
                                    <input
                                        type='text'
                                        value={personNameInput}
                                        onChange={handlePersonNameInputChange}
                                        placeholder='Tag person...'
                                        autoFocus
                                    />
                                    {personSuggestions.length > 0 && (
                                        <ul className={styles.suggestionsList}>
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
                                    {personNameInput && (
                                        <button
                                            onClick={() => handleCreateAndAssignPerson(task.id)}
                                        >
                                            Create & Assign "{personNameInput}"
                                        </button>
                                    )}
                                </div>
                            )}

                            <div className={styles.assignedPeople}>
                                {assignedPeople.slice(0, MAX_VISIBLE_AVATARS).map((person) => (
                                    <Tippy key={person.id} content={person.name} placement='top'>
                                        <div
                                            className={styles.avatar}
                                            onClick={() =>
                                                handleRemovePersonFromTask(task.id, person.id)
                                            }
                                        >
                                            {person.initials}
                                        </div>
                                    </Tippy>
                                ))}
                                {assignedPeople.length > MAX_VISIBLE_AVATARS && (
                                    <Tippy
                                        content={assignedPeople
                                            .slice(MAX_VISIBLE_AVATARS)
                                            .map((p) => p.name)
                                            .join(', ')}
                                        placement='top'
                                    >
                                        <div className={styles.avatar}>
                                            +{assignedPeople.length - MAX_VISIBLE_AVATARS}
                                        </div>
                                    </Tippy>
                                )}
                            </div>

                            <ul className={styles.taskItemsList}>
                                {incompleteItems.map((item) => renderTaskItem(task, item, false))}
                            </ul>

                            {completedItems.length > 0 && (
                                <div className={styles.completedItemsSection}>
                                    <button
                                        onClick={() => toggleShowCompleted(task.id)}
                                        className={styles.toggleCompletedButton}
                                    >
                                        {showCompleted[task.id] ? 'Hide' : 'Show'}{' '}
                                        {completedItems.length} Completed Item(s)
                                    </button>
                                    {showCompleted[task.id] && (
                                        <ul className={styles.taskItemsList}>
                                            {completedItems.map((item) =>
                                                renderTaskItem(task, item, true)
                                            )}
                                        </ul>
                                    )}
                                </div>
                            )}

                            <form
                                onSubmit={(e) => handleAddNewItem(e, task.id)}
                                className={styles.newItemForm}
                            >
                                <input
                                    type='text'
                                    value={newItemText[task.id] || ''}
                                    onChange={(e) => handleNewItemChange(task.id, e.target.value)}
                                    placeholder='+ Add an item'
                                    className={styles.newItemInput}
                                />
                                <button type='submit'>Add</button>
                            </form>
                        </div>
                    );
                })}
            </div>

            <form onSubmit={handleAddNewTask} className={styles.newTaskForm}>
                <input
                    type='text'
                    value={newTaskTitle}
                    onChange={handleNewTaskChange}
                    placeholder='+ Add new task'
                    className={styles.newTaskInput}
                />
                <button type='submit' className={styles.newTaskButton}>
                    Add Task
                </button>
            </form>
        </div>
    );
};

export default ProjectLane;
