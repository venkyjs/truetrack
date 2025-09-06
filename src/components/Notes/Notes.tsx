import { useState, useMemo } from 'react';
import type { FC } from 'react';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/themes/material_blue.css';
import { format, startOfDay, isSameDay } from 'date-fns';
import type { Note, Person } from '../../types';
import styles from './Notes.module.css';

interface NotesProps {
    notes: Note[];
    people: Person[];
    onAddNote: (noteData: { text: string; people: string[]; followUpDate?: Date }) => void;
    onFindOrCreatePerson: (name: string) => string;
}

const Notes: FC<NotesProps> = ({ notes, people, onAddNote, onFindOrCreatePerson }) => {
    const [noteText, setNoteText] = useState('');
    const [selectedPeople, setSelectedPeople] = useState<string[]>([]);
    const [followUpDate, setFollowUpDate] = useState<Date | null>(null);
    const [peopleInput, setPeopleInput] = useState('');
    const [showPeopleSuggestions, setShowPeopleSuggestions] = useState(false);

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

        notes.forEach((note) => {
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

    const handleAddNote = () => {
        if (!noteText.trim()) return;

        onAddNote({
            text: noteText.trim(),
            people: selectedPeople,
            followUpDate: followUpDate || undefined
        });

        // Reset form
        setNoteText('');
        setSelectedPeople([]);
        setFollowUpDate(null);
        setPeopleInput('');
    };

    const handleAddPerson = (personId: string) => {
        if (!selectedPeople.includes(personId)) {
            setSelectedPeople([...selectedPeople, personId]);
        }
        setPeopleInput('');
        setShowPeopleSuggestions(false);
    };

    // Normalize react-date-picker value to a single Date or null
    const handleFollowUpDateChange = (dates: Date[]) => {
        setFollowUpDate(dates[0] || null);
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
                            <Flatpickr
                                value={followUpDate || undefined}
                                onChange={handleFollowUpDateChange}
                                placeholder='Follow-up Date'
                                className={styles.datePicker}
                            />
                        </div>
                        <button
                            className={styles.addButton}
                            onClick={handleAddNote}
                            disabled={!noteText.trim()}
                        >
                            Add Note
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
                                    <div className={styles.noteText}>{note.text}</div>

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

                                        <div className={styles.noteDetails}>
                                            <span className={styles.creationTime}>
                                                {formatTime(note.creationDate)}
                                            </span>
                                            {note.followUpDate && (
                                                <span className={styles.followUpDate}>
                                                    Follow-up:{' '}
                                                    {format(
                                                        typeof note.followUpDate === 'string'
                                                            ? new Date(note.followUpDate)
                                                            : note.followUpDate,
                                                        'MMM d, yyyy'
                                                    )}
                                                </span>
                                            )}
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
