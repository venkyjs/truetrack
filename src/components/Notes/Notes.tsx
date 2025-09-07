import { useState, useMemo, useRef, useEffect } from 'react';
import type { FC } from 'react';
import Pikaday from 'pikaday';
import 'pikaday/css/pikaday.css';
import { format, startOfDay, isSameDay } from 'date-fns';
import type { Note, Person } from '../../types';
import styles from './Notes.module.css';

interface NotesProps {
    notes: Note[];
    people: Person[];
    onAddNote: (noteData: { text: string; people: string[]; followUpDate?: Date }) => void;
    onUpdateNote: (note: Note) => void;
    onArchiveNote: (noteId: string) => void;
    onDeleteNote: (noteId: string) => void;
    onFindOrCreatePerson: (name: string) => string;
}

const Notes: FC<NotesProps> = ({
    notes,
    people,
    onAddNote,
    onUpdateNote,
    onArchiveNote,
    onDeleteNote,
    onFindOrCreatePerson
}) => {
    const [noteText, setNoteText] = useState('');
    const [selectedPeople, setSelectedPeople] = useState<string[]>([]);
    const [followUpDate, setFollowUpDate] = useState<Date | null>(null);
    const [peopleInput, setPeopleInput] = useState('');
    const [showPeopleSuggestions, setShowPeopleSuggestions] = useState(false);
    const [editingNote, setEditingNote] = useState<Note | null>(null);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const dateInputRef = useRef<HTMLInputElement>(null);
    const pikadayRef = useRef<Pikaday | null>(null);
    const isSettingDateProgrammatically = useRef(false);

    // Initialize Pikaday
    useEffect(() => {
        if (dateInputRef.current && !pikadayRef.current) {
            pikadayRef.current = new Pikaday({
                field: dateInputRef.current,
                format: 'YYYY-MM-DD',
                onSelect: (date: Date) => {
                    // Ignore programmatic date changes
                    if (isSettingDateProgrammatically.current) {
                        isSettingDateProgrammatically.current = false;
                        return;
                    }

                    setFollowUpDate((currentDate) => {
                        const newDateString = date.toISOString().split('T')[0];
                        const currentDateString = currentDate
                            ? currentDate.toISOString().split('T')[0]
                            : null;

                        // Only hide the calendar if a different date was selected
                        if (newDateString !== currentDateString && pikadayRef.current) {
                            pikadayRef.current.hide();
                        }

                        return date;
                    });
                }
            });
        }

        return () => {
            if (pikadayRef.current) {
                pikadayRef.current.destroy();
                pikadayRef.current = null;
            }
        };
    }, []);

    // Update Pikaday when followUpDate changes externally (e.g., when editing a note)
    useEffect(() => {
        if (pikadayRef.current) {
            isSettingDateProgrammatically.current = true;
            if (followUpDate) {
                pikadayRef.current.setDate(followUpDate);
            } else {
                pikadayRef.current.setDate(null);
            }
        }
    }, [followUpDate]);

    // Filter people suggestions based on input
    const peopleSuggestions = useMemo(() => {
        if (!peopleInput.trim()) return people;
        return people.filter((person) =>
            person.name.toLowerCase().includes(peopleInput.toLowerCase())
        );
    }, [people, peopleInput]);

    // Group notes by creation date
    const groupedNotes = useMemo(() => {
        const groups: { [key: string]: Note[] } = {};

        const activeNotes = notes.filter((note) => !note.isArchived);

        activeNotes.forEach((note) => {
            const creationDate =
                typeof note.creationDate === 'string'
                    ? new Date(note.creationDate)
                    : note.creationDate;
            const dateKey = format(startOfDay(creationDate), 'yyyy-MM-dd');

            if (!groups[dateKey]) {
                groups[dateKey] = [];
            }
            groups[dateKey].push(note);
        });

        // Sort notes within each group by creation time (newest first)
        Object.keys(groups).forEach((dateKey) => {
            groups[dateKey].sort((a, b) => {
                const dateA =
                    typeof a.creationDate === 'string' ? new Date(a.creationDate) : a.creationDate;
                const dateB =
                    typeof b.creationDate === 'string' ? new Date(b.creationDate) : b.creationDate;
                return dateB.getTime() - dateA.getTime();
            });
        });

        // Sort date groups (newest first)
        const sortedGroups = Object.keys(groups)
            .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
            .map((dateKey) => ({
                date: new Date(`${dateKey}T00:00:00`),
                notes: groups[dateKey]
            }));

        return sortedGroups;
    }, [notes]);

    const handleAddOrUpdateNote = () => {
        if (!noteText.trim()) return;

        if (editingNote) {
            onUpdateNote({
                ...editingNote,
                text: noteText.trim(),
                people: selectedPeople,
                followUpDate: followUpDate || undefined
            });
        } else {
            onAddNote({
                text: noteText.trim(),
                people: selectedPeople,
                followUpDate: followUpDate || undefined
            });
        }

        // Reset form
        setNoteText('');
        setSelectedPeople([]);
        setFollowUpDate(null);
        setPeopleInput('');
        setEditingNote(null);
    };

    const handleEditNote = (note: Note) => {
        setEditingNote(note);
        setNoteText(note.text);
        setSelectedPeople(note.people);
        setFollowUpDate(note.followUpDate ? new Date(note.followUpDate as string) : null);
        setOpenMenuId(null);
    };

    const handleAddPerson = (personId: string) => {
        if (!selectedPeople.includes(personId)) {
            setSelectedPeople([...selectedPeople, personId]);
        }
        setPeopleInput('');
        setShowPeopleSuggestions(false);
    };

    const handleCreateNewPerson = () => {
        if (!peopleInput.trim()) return;
        const personId = onFindOrCreatePerson(peopleInput.trim());
        handleAddPerson(personId);
    };

    const handleRemovePerson = (personId: string) => {
        setSelectedPeople(selectedPeople.filter((id) => id !== personId));
    };

    const getPersonById = (personId: string) => {
        return people.find((p) => p.id === personId);
    };

    const formatDate = (date: Date) => {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (isSameDay(date, today)) {
            return 'Today';
        } else if (isSameDay(date, yesterday)) {
            return 'Yesterday';
        } else {
            return format(date, 'MMMM d, yyyy');
        }
    };

    const formatTime = (date: Date | string) => {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        return format(dateObj, 'h:mm a');
    };

    return (
        <div className={styles.notesContainer}>
            {/* Note Input Form */}
            <div className={styles.inputSection}>
                <div className={styles.noteInputLayout}>
                    <div className={styles.noteInputContainer}>
                        <textarea
                            className={styles.noteInput}
                            placeholder='Type your note here...'
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            rows={4}
                        />
                    </div>
                    <div className={styles.actionsContainer}>
                        <div className={styles.peopleSection}>
                            <div className={styles.peopleInputContainer}>
                                <input
                                    type='text'
                                    className={styles.peopleInput}
                                    placeholder='Add people...'
                                    value={peopleInput}
                                    onChange={(e) => setPeopleInput(e.target.value)}
                                    onFocus={() => setShowPeopleSuggestions(true)}
                                    onBlur={() => {
                                        // Delay hiding suggestions to allow clicking
                                        setTimeout(() => setShowPeopleSuggestions(false), 200);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && peopleInput.trim()) {
                                            e.preventDefault();
                                            handleCreateNewPerson();
                                        }
                                    }}
                                />

                                {showPeopleSuggestions && (
                                    <div className={styles.suggestions}>
                                        {peopleSuggestions.map((person) => (
                                            <div
                                                key={person.id}
                                                className={styles.suggestion}
                                                onMouseDown={() => handleAddPerson(person.id)}
                                            >
                                                <div className={styles.personInitials}>
                                                    {person.initials}
                                                </div>
                                                {person.name}
                                            </div>
                                        ))}
                                        {peopleInput.trim() &&
                                            !peopleSuggestions.some(
                                                (p) =>
                                                    p.name.toLowerCase() ===
                                                    peopleInput.toLowerCase()
                                            ) && (
                                                <div
                                                    className={`${styles.suggestion} ${styles.createNew}`}
                                                    onMouseDown={handleCreateNewPerson}
                                                >
                                                    Create "{peopleInput}"
                                                </div>
                                            )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className={styles.dateSection}>
                            <input
                                ref={dateInputRef}
                                type='text'
                                placeholder='Follow-up Date'
                                className={styles.datePicker}
                                readOnly
                            />
                        </div>
                        <button
                            className={styles.addButton}
                            onClick={handleAddOrUpdateNote}
                            disabled={!noteText.trim()}
                        >
                            {editingNote ? 'Update Note' : 'Add Note'}
                        </button>
                    </div>
                </div>

                {/* Selected People */}
                {selectedPeople.length > 0 && (
                    <div className={styles.selectedPeople}>
                        {selectedPeople.map((personId) => {
                            const person = getPersonById(personId);
                            return person ? (
                                <div key={personId} className={styles.selectedPerson}>
                                    <div className={styles.personInitials}>{person.initials}</div>
                                    <span>{person.name}</span>
                                    <button
                                        className={styles.removeButton}
                                        onClick={() => handleRemovePerson(personId)}
                                    >
                                        ×
                                    </button>
                                </div>
                            ) : null;
                        })}
                    </div>
                )}
            </div>

            {/* Notes Display */}
            <div className={styles.notesDisplay}>
                {groupedNotes.length === 0 ? (
                    <div className={styles.emptyState}>
                        No notes yet. Add your first note above!
                    </div>
                ) : (
                    groupedNotes.map(({ date, notes: dayNotes }) => (
                        <div key={date.toISOString()} className={styles.dateGroup}>
                            <h2 className={styles.dateHeader}>{formatDate(date)}</h2>

                            {dayNotes.map((note) => (
                                <div key={note.id} className={styles.noteItem}>
                                    <div className={styles.noteContent}>
                                        <div className={styles.noteText}>{note.text}</div>
                                        {note.followUpDate && (
                                            <div className={styles.followUpDate}>
                                                Follow-up:{' '}
                                                {format(
                                                    typeof note.followUpDate === 'string'
                                                        ? new Date(note.followUpDate)
                                                        : note.followUpDate,
                                                    'MMMM d, yyyy'
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className={styles.noteMetadata}>
                                        <div className={styles.notePeople}>
                                            {note.people.map((personId) => {
                                                const person = getPersonById(personId);
                                                return person ? (
                                                    <div
                                                        key={personId}
                                                        className={styles.personCircle}
                                                        title={person.name}
                                                    >
                                                        {person.initials}
                                                    </div>
                                                ) : null;
                                            })}
                                        </div>

                                        <div className={styles.noteActions}>
                                            <span className={styles.creationTime}>
                                                {formatTime(note.creationDate)}
                                            </span>
                                            <div className={styles.menuContainer}>
                                                <button
                                                    className={styles.menuButton}
                                                    onClick={() =>
                                                        setOpenMenuId(
                                                            openMenuId === note.id ? null : note.id
                                                        )
                                                    }
                                                >
                                                    &#x22EE;
                                                </button>
                                                {openMenuId === note.id && (
                                                    <div className={styles.menu}>
                                                        <div
                                                            className={styles.menuItem}
                                                            onClick={() => handleEditNote(note)}
                                                        >
                                                            Edit
                                                        </div>
                                                        <div
                                                            className={styles.menuItem}
                                                            onClick={() => {
                                                                onArchiveNote(note.id);
                                                                setOpenMenuId(null);
                                                            }}
                                                        >
                                                            Archive
                                                        </div>
                                                        <div
                                                            className={styles.menuItem}
                                                            onClick={() => {
                                                                onDeleteNote(note.id);
                                                                setOpenMenuId(null);
                                                            }}
                                                        >
                                                            Delete
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Notes;
