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
    faCalendarAlt
} from '@fortawesome/free-solid-svg-icons';
import Tippy from '@tippyjs/react';
import DateTimePicker from 'react-datetime-picker';
import 'react-datetime-picker/dist/DateTimePicker.css';
import { Calendar } from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import 'react-clock/dist/Clock.css';
import { format } from 'date-fns'; // For formatting the date
import { HexColorPicker } from 'react-colorful';

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
    highlightTerm?: string;
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
    highlightTerm
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

    const highlight = (text: string, term?: string) => {
        if (!term) return text;
        const regex = new RegExp(`(${term})`, 'gi');
        const parts = text.split(regex);
        return (
            <span>
                {parts.map((part, i) =>
                    regex.test(part) ? (
                        <strong key={i} className={styles.highlight}>
                            {part}
                        </strong>
                    ) : (
                        part
                    )
                )}
            </span>
        );
    };

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

    const handleReminderIconClick = (task: Task) => {
        if (editingReminderTaskId === task.id) {
            setEditingReminderTaskId(null);
        } else {
            setEditingReminderTaskId(task.id);
        }
    };

    const handleClearReminder = (taskId: string) => {
        onUpdateTask(project.id, taskId, { reminder: undefined });
        setEditingReminderTaskId(null);
    };

    const handleSetProjectTaskColor = (color?: string) => {
        onUpdateProjectTaskColor(project.id, color);
    };

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

        if (showColorPicker) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showColorPicker]);

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

        if (calendarOpenForTaskId) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [calendarOpenForTaskId]);

    const toggleShowCompleted = (taskId: string) => {
        setShowCompleted((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
    };

    const projectLaneStyle = {
        borderTop: `5px solid ${project.taskColor || '#ccc'}`, // Use project.taskColor for top border
        borderRight: `3px solid ${project.taskColor || '#ccc'}` // Use project.taskColor for top border
    };

    const taskListStyle = {
        backgroundColor: project.taskColor ? `${project.taskColor}08` : 'transparent' // Even lighter background for task list
    };

    const MAX_VISIBLE_AVATARS = 3;

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
                    className={styles.stickyInput}
                />
            ) : (
                <span
                    className={`${styles.taskItemText} ${
                        item.completed ? styles.completedItemText : ''
                    }`}
                    onDoubleClick={() => handleItemTextDoubleClick(task, item)}
                >
                    {highlight(item.text, highlightTerm)}
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
        <div className={styles.projectLaneContainer} style={projectLaneStyle}>
            <div className={styles.projectHeader}>
                <div className={styles.projectTitleContainer}>
                    {isEditingProjectTitle ? (
                        <input
                            type='text'
                            value={editingProjectTitle}
                            onChange={handleProjectTitleChange}
                            onBlur={handleProjectTitleSave}
                            onKeyDown={handleProjectTitleKeyDown}
                            className={classNames(styles.stickyInput, styles.projectTitleInput)}
                            autoFocus
                        />
                    ) : (
                        <Tippy
                            content='Double-click to edit title'
                            placement='top-start'
                            theme='material'
                        >
                            <h2
                                className={styles.projectTitle}
                                onDoubleClick={handleProjectTitleDoubleClick}
                            >
                                {highlight(project.title, highlightTerm)}
                            </h2>
                        </Tippy>
                    )}
                    {!isEditingProjectTitle && (
                        <>
                            <Tippy content='Edit Project Title' placement='top' theme='material'>
                                <button
                                    onClick={handleProjectTitleEditClick}
                                    className={styles.editProjectBtn}
                                >
                                    <FontAwesomeIcon icon={faEdit} />
                                </button>
                            </Tippy>
                            <Tippy content='Change Project Color' placement='top' theme='material'>
                                <div className={styles.colorPickerContainer}>
                                    <button
                                        ref={colorPickerButtonRef}
                                        onClick={() => {
                                            if (colorPickerButtonRef.current) {
                                                const rect =
                                                    colorPickerButtonRef.current.getBoundingClientRect();
                                                setColorPickerPosition({
                                                    top: rect.bottom + window.scrollY + 5,
                                                    left: rect.left + window.scrollX
                                                });
                                            }
                                            setShowColorPicker(!showColorPicker);
                                        }}
                                        className={styles.editProjectBtn}
                                    >
                                        <FontAwesomeIcon icon={faPalette} />
                                    </button>
                                </div>
                            </Tippy>
                            <Tippy content='Delete Project' placement='top' theme='material'>
                                <button
                                    onClick={() => onDeleteProject(project.id)}
                                    className={styles.editProjectBtn}
                                >
                                    <FontAwesomeIcon icon={faTrashAlt} />
                                </button>
                            </Tippy>
                        </>
                    )}
                </div>
            </div>

            <form onSubmit={handleAddNewTask} className={styles.addTaskForm}>
                <input
                    type='text'
                    value={newTaskTitle}
                    onChange={handleNewTaskChange}
                    placeholder='Add new task...'
                    className={styles.stickyInput}
                />
                <Tippy content='Add Task' placement='top' theme='material'>
                    <button type='submit' className={styles.addPersonBtn}>
                        <FontAwesomeIcon icon={faPlus} />
                    </button>
                </Tippy>
            </form>

            <div className={styles.taskList} style={taskListStyle}>
                {project.tasks.map((task) => {
                    const assignedPeopleDetails = getAssignedPeopleDetails(task.id);

                    return (
                        <div
                            key={task.id}
                            className={styles.taskCard}
                            style={{ backgroundColor: project.taskColor || '#f0f0f0' }}
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
                                    <Tippy
                                        content='Double-click to edit task title'
                                        placement='top-start'
                                        theme='material'
                                    >
                                        <h3
                                            className={styles.taskTitle}
                                            onDoubleClick={() => handleTaskTitleDoubleClick(task)}
                                        >
                                            {highlight(task.title, highlightTerm)}
                                        </h3>
                                    </Tippy>
                                )}
                                <Tippy content='Delete Task' placement='top' theme='material'>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDeleteTask(project.id, task.id);
                                        }}
                                        className={styles.deleteTaskBtn}
                                    >
                                        <FontAwesomeIcon icon={faTimes} />
                                    </button>
                                </Tippy>
                            </div>

                            {/* Task Items */}
                            <div className={styles.taskItemsContainer}>
                                {task.items
                                    .filter((item) => !item.completed)
                                    .map((item) => renderTaskItem(task, item, false))}
                            </div>

                            {/* Completed Items Section */}
                            {task.items.some((i) => i.completed) && (
                                <details
                                    className={styles.completedSectionDetails}
                                    onToggle={() => toggleShowCompleted(task.id)}
                                >
                                    <Tippy
                                        content={
                                            showCompleted[task.id]
                                                ? 'Hide completed items'
                                                : 'Show completed items'
                                        }
                                        placement='top-start'
                                        theme='material'
                                    >
                                        <summary className={styles.completedSectionSummary}>
                                            Completed (
                                            {task.items.filter((i) => i.completed).length})
                                        </summary>
                                    </Tippy>
                                    {showCompleted[task.id] && (
                                        <div className={styles.completedItemsContainer}>
                                            {task.items
                                                .filter((item) => item.completed)
                                                .map((item) => renderTaskItem(task, item, true))}
                                        </div>
                                    )}
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
                                        e.key === 'Enter' && handleAddNewItem(e, task.id)
                                    }
                                    className={styles.stickyInput}
                                />
                                <Tippy content='Add Item' placement='right' theme='material'>
                                    <button
                                        type='submit'
                                        className={styles.addItemBtn}
                                        onClick={(e) => handleAddNewItem(e, task.id)}
                                    >
                                        <FontAwesomeIcon icon={faPlus} />
                                    </button>
                                </Tippy>
                            </div>

                            {/* Person Tagging UI */}
                            <div className={styles.taskFooter}>
                                <div className={styles.mainActionsRow}>
                                    <div className={styles.avatarsDisplayContainer}>
                                        {assignedPeopleDetails
                                            .slice(0, MAX_VISIBLE_AVATARS)
                                            .map((person) => (
                                                <Tippy
                                                    content={`Assigned to ${person.name}. Click to remove.`}
                                                    key={person.id}
                                                    placement='top'
                                                    theme='material'
                                                >
                                                    <div
                                                        className={styles.personAvatar}
                                                        onClick={() =>
                                                            handleRemovePersonFromTask(
                                                                task.id,
                                                                person.id
                                                            )
                                                        }
                                                    >
                                                        {person.initials}
                                                    </div>
                                                </Tippy>
                                            ))}
                                        {assignedPeopleDetails.length > MAX_VISIBLE_AVATARS && (
                                            <Tippy
                                                content={`+${
                                                    assignedPeopleDetails.length -
                                                    MAX_VISIBLE_AVATARS
                                                } more`}
                                                placement='top'
                                                theme='material'
                                            >
                                                <div
                                                    className={`${styles.personAvatar} ${styles.overflowAvatar}`}
                                                >
                                                    +
                                                    {assignedPeopleDetails.length -
                                                        MAX_VISIBLE_AVATARS}
                                                </div>
                                            </Tippy>
                                        )}
                                    </div>

                                    <div className={styles.actionButtonsGroup}>
                                        <Tippy
                                            content='Assign Person'
                                            placement='top'
                                            theme='material'
                                        >
                                            <button
                                                onClick={() => handleOpenPersonTagging(task.id)}
                                                className={styles.addPersonBtn}
                                            >
                                                <FontAwesomeIcon icon={faTag} />
                                            </button>
                                        </Tippy>

                                        {/* Reminder Button/Input grouped into a new div */}
                                        <div className={styles.reminderSection}>
                                            {editingReminderTaskId === task.id && (
                                                <div className={styles.datepickerContainer}>
                                                    <DateTimePicker
                                                        onChange={(newDate: Date | null) => {
                                                            onUpdateTask(project.id, task.id, {
                                                                reminder: newDate
                                                                    ? newDate.toISOString()
                                                                    : undefined
                                                            });
                                                            setEditingReminderTaskId(null);
                                                        }}
                                                        value={
                                                            task.reminder
                                                                ? new Date(task.reminder)
                                                                : null
                                                        }
                                                        locale='en-US'
                                                        minDate={new Date()}
                                                        format='MM/dd/yyyy h:mm a'
                                                        disableCalendar={true}
                                                        disableClock={false}
                                                    />
                                                    <Tippy
                                                        content='Open Calendar'
                                                        placement='top'
                                                        theme='material'
                                                    >
                                                        <button
                                                            ref={calendarButtonRef}
                                                            onClick={(e) => {
                                                                const container = (
                                                                    e.currentTarget as HTMLElement
                                                                ).closest(
                                                                    `.${styles.datepickerContainer}`
                                                                );
                                                                if (container) {
                                                                    const rect =
                                                                        container.getBoundingClientRect();
                                                                    setCalendarPosition({
                                                                        top:
                                                                            rect.bottom +
                                                                            window.scrollY,
                                                                        left:
                                                                            rect.left +
                                                                            window.scrollX
                                                                    });
                                                                }
                                                                setCalendarOpenForTaskId(
                                                                    calendarOpenForTaskId ===
                                                                        task.id
                                                                        ? null
                                                                        : task.id
                                                                );
                                                            }}
                                                            className={styles.calendarToggleBtn}
                                                        >
                                                            <FontAwesomeIcon icon={faCalendarAlt} />
                                                        </button>
                                                    </Tippy>
                                                </div>
                                            )}

                                            {!editingReminderTaskId ||
                                            editingReminderTaskId !== task.id ? (
                                                task.reminder ? (
                                                    <div className={styles.reminderSetContainer}>
                                                        <Tippy
                                                            content='Edit Reminder'
                                                            placement='top'
                                                            theme='material'
                                                        >
                                                            <span
                                                                className={styles.reminderText}
                                                                onClick={() =>
                                                                    handleReminderIconClick(task)
                                                                }
                                                            >
                                                                <FontAwesomeIcon
                                                                    icon={faBell}
                                                                    style={{ marginRight: '5px' }}
                                                                />
                                                                {format(
                                                                    new Date(task.reminder),
                                                                    'MM/dd hh:mm aa'
                                                                )}
                                                            </span>
                                                        </Tippy>
                                                        <Tippy
                                                            content='Clear Reminder'
                                                            placement='top'
                                                            theme='material'
                                                        >
                                                            <button
                                                                onClick={() =>
                                                                    handleClearReminder(task.id)
                                                                }
                                                                className={
                                                                    styles.clearReminderBtnInline
                                                                }
                                                            >
                                                                <FontAwesomeIcon
                                                                    icon={faTimes}
                                                                    size='sm'
                                                                />
                                                            </button>
                                                        </Tippy>
                                                    </div>
                                                ) : (
                                                    <Tippy
                                                        content='Set Reminder'
                                                        placement='top'
                                                        theme='material'
                                                    >
                                                        <button
                                                            onClick={() =>
                                                                handleReminderIconClick(task)
                                                            }
                                                            className={styles.reminderIconBtn}
                                                        >
                                                            <FontAwesomeIcon icon={faBellSlash} />
                                                        </button>
                                                    </Tippy>
                                                )
                                            ) : null}
                                        </div>
                                    </div>
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
                                        <div className={styles.personTaggingActions}>
                                            <Tippy
                                                content='Add and Assign'
                                                placement='bottom'
                                                theme='material'
                                            >
                                                <button
                                                    onClick={() =>
                                                        handleCreateAndAssignPerson(task.id)
                                                    }
                                                    className={styles.confirmAddPersonBtn}
                                                >
                                                    <FontAwesomeIcon icon={faPlus} /> Add & Assign
                                                </button>
                                            </Tippy>
                                            <Tippy
                                                content='Cancel'
                                                placement='bottom'
                                                theme='material'
                                            >
                                                <button
                                                    onClick={() => setTaggingPersonTaskId(null)}
                                                    className={styles.cancelAddPersonBtn}
                                                >
                                                    <FontAwesomeIcon icon={faTimes} /> Cancel
                                                </button>
                                            </Tippy>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
                {project.tasks.length === 0 && (
                    <p className={styles.noTasksMessage}>No tasks yet. Add one below!</p>
                )}
            </div>
            {showColorPicker &&
                ReactDOM.createPortal(
                    <div
                        ref={colorPickerPopoverRef}
                        style={{
                            position: 'absolute',
                            top: `${colorPickerPosition.top}px`,
                            left: `${colorPickerPosition.left}px`,
                            zIndex: 1060
                        }}
                        className={styles.colorPickerPopover}
                    >
                        <HexColorPicker
                            color={project.taskColor || '#ffffff'}
                            onChange={handleSetProjectTaskColor}
                        />
                        <div className={styles.predefinedColors}>
                            {PREDEFINED_TASK_COLORS.map((color) => (
                                <button
                                    key={color}
                                    style={{ backgroundColor: color }}
                                    className={styles.colorOption}
                                    onClick={() => handleSetProjectTaskColor(color)}
                                />
                            ))}
                        </div>
                        <button
                            className={styles.clearColorButton}
                            onClick={() => handleSetProjectTaskColor(undefined)}
                        >
                            Clear Color
                        </button>
                    </div>,
                    document.body
                )}
            {calendarOpenForTaskId &&
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
                        <Calendar
                            onChange={(date: any) => {
                                const task = project.tasks.find(
                                    (t) => t.id === calendarOpenForTaskId
                                );
                                if (task) {
                                    const newDate = new Date(date);
                                    const existingReminder = task.reminder
                                        ? new Date(task.reminder)
                                        : new Date();

                                    newDate.setHours(existingReminder.getHours());
                                    newDate.setMinutes(existingReminder.getMinutes());
                                    newDate.setSeconds(existingReminder.getSeconds());

                                    onUpdateTask(project.id, task.id, {
                                        reminder: newDate.toISOString()
                                    });
                                }
                                setCalendarOpenForTaskId(null);
                            }}
                            value={
                                project.tasks.find((t) => t.id === calendarOpenForTaskId)?.reminder
                                    ? new Date(
                                          project.tasks.find(
                                              (t) => t.id === calendarOpenForTaskId
                                          )!.reminder!
                                      )
                                    : null
                            }
                            minDate={new Date()}
                        />
                    </div>,
                    document.body
                )}
        </div>
    );
};

export default ProjectLane;
