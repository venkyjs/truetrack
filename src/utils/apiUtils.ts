import type { Note } from '../types';

interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
}

/**
 * Generic API call utility with error handling and offline detection
 */
const makeApiCall = async <T = any>(
    url: string,
    options: RequestInit = {}
): Promise<ApiResponse<T>> => {
    if (!navigator.onLine) {
        console.log('Offline. Skipping API call.');
        return { success: false, error: 'Offline' };
    }

    try {
        // Only set Content-Type header when we have a body
        const headers: Record<string, string> = {
            ...((options.headers as Record<string, string>) || {})
        };

        if (options.body) {
            headers['Content-Type'] = 'application/json';
        }

        const response = await fetch(url, {
            headers,
            ...options
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Handle responses with no content (like DELETE)
        if (response.status === 204 || response.headers.get('content-length') === '0') {
            return { success: true };
        }

        const data = await response.json();
        return { success: true, data };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('API call failed:', errorMessage);
        return { success: false, error: errorMessage };
    }
};

/**
 * Notes API utilities
 */
export const notesApi = {
    /**
     * Get all notes from backend
     */
    async getAllNotes(): Promise<ApiResponse<Note[]>> {
        const result = await makeApiCall<Note[]>('/api/notes');
        if (result.success) {
            console.log('Notes loaded from backend');
        } else {
            console.error('Failed to load notes from backend:', result.error);
        }
        return result;
    },

    /**
     * Create a new note
     */
    async createNote(note: Note): Promise<ApiResponse<Note>> {
        const result = await makeApiCall<Note>('/api/notes', {
            method: 'POST',
            body: JSON.stringify(note)
        });
        if (result.success) {
            console.log('Note synced with backend');
        } else {
            console.error('Failed to sync note with backend:', result.error);
        }
        return result;
    },

    /**
     * Update an existing note
     */
    async updateNote(note: Note): Promise<ApiResponse<Note>> {
        const result = await makeApiCall<Note>(`/api/notes/${note.id}`, {
            method: 'PUT',
            body: JSON.stringify(note)
        });
        if (result.success) {
            console.log('Note updated on backend');
        } else {
            console.error('Failed to update note on backend:', result.error);
        }
        return result;
    },

    /**
     * Delete a note
     */
    async deleteNote(noteId: string): Promise<ApiResponse<void>> {
        const result = await makeApiCall<void>(`/api/notes/${noteId}`, {
            method: 'DELETE'
        });
        if (result.success) {
            console.log('Note deleted on backend');
        } else {
            console.error('Failed to delete note on backend:', result.error);
        }
        return result;
    },

    /**
     * Archive a note (convenience method for updating with isArchived: true)
     */
    async archiveNote(note: Note): Promise<ApiResponse<Note>> {
        const archivedNote = { ...note, isArchived: true };
        const result = await makeApiCall<Note>(`/api/notes/${note.id}`, {
            method: 'PUT',
            body: JSON.stringify(archivedNote)
        });
        if (result.success) {
            console.log('Note archived on backend');
        } else {
            console.error('Failed to archive note on backend:', result.error);
        }
        return result;
    }
};

/**
 * General sync API utility
 */
export const syncApi = {
    /**
     * Sync all data with backend
     */
    async syncData(data: {
        projects: any[];
        globalPeople: any[];
        notes: Note[];
    }): Promise<ApiResponse<void>> {
        const result = await makeApiCall<void>('/api/sync', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        if (result.success) {
            console.log('Data synced with backend');
        } else {
            console.error('Failed to sync data with backend:', result.error);
        }
        return result;
    }
};
