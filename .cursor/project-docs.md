## TrueTrack codebase reference

This document summarizes the architecture, data flow, dependencies, and important conventions in the TrueTrack project. It is intended as a pre-change checklist and quick reference for future edits.

### High-level overview

-   Frontend: React + TypeScript built with Vite, using CSS Modules and a few UI libraries. Entry via `index.html` → `src/main.tsx` → `src/App.tsx`.
-   Persistence: IndexedDB (`appData` object store) for offline-first state; optional sync to a lightweight Fastify backend.
-   Search: Client-side search index built with Lunr from projects and task content.
-   Backend: Fastify server persisting sync payloads to `db.json` (append-only array).

### Repository structure (selected)

-   `index.html` – Root HTML, injects `src/main.tsx`.
-   `src/main.tsx` – React root, global CSS, favicon injection.
-   `src/App.tsx` – Application state, persistence, search, layout. Orchestrates components.
-   `src/components/`
    -   `AppHeader/` – Header bar with logo, search, add-project, preferences.
    -   `PreferencesDialog/` – Modal for wallpaper and data backup/restore.
    -   `ProjectLane.tsx` – Per-project board with tasks, items, people, reminders.
    -   `ProjectLane.module.css` – Styles for the project lane.
    -   `TooltipStyles.css` – Custom Tippy theme.
-   `src/types/index.ts` – Domain types: `Project`, `Task`, `TaskItem`, `Person`.
-   `src/utils/`
    -   `indexedDB.ts` – IndexedDB wrapper (`appData` store, key/value records).
    -   `dataUtils.ts` – Export/import helpers over the same store.
    -   `cryptoUtils.ts` – AES encryption/decryption helpers using `crypto-js`.
-   `truetrack-backend/` – Fastify server with `/sync` endpoints writing `db.json`.
-   Tooling/config: `vite.config.ts`, `eslint.config.js`, `tsconfig*.json`, `package.json`.

### Scripts and tooling

-   `npm run dev` – Vite dev server.
-   `npm run build` – Type-check then Vite build (single-file plugin enabled; target `es2020`, no minify).
-   `npm run preview` – Vite preview.
-   `npm run server` – Start backend server (`truetrack-backend`).
-   ESLint: `eslint.config.js` with TS and React hooks rules; strict TS compiler options in `tsconfig.app.json`.

Vite config: `viteSingleFile()` produces a single JS bundle; `build.target = es2020`, `minify = false`.

### Domain model (from `src/types/index.ts`)

-   `TaskItem`: `{ id: string, text: string, completed: boolean }`
-   `Person`: `{ id: string, name: string, initials: string }`
-   `Task`:
    -   `id: string`
    -   `title: string`
    -   `items: TaskItem[]`
    -   `assignedPersons: string[]` (references `Person.id`)
    -   `reminder?: Date | string` (App normalizes to ISO string on load/save)
    -   `color?: string`
    -   `archived?: boolean`
-   `Project`:
    -   `id: string` (format `project-<n>`)
    -   `title: string`
    -   `tasks: Task[]`
    -   `taskColor: string` (default pastel color used for task visuals)
    -   `position: number` (1-based ordering across projects)

### State and data flow

-   App state in `src/App.tsx`:

    -   `projects: Project[]` – In-memory projects list.
    -   `globalPeople: Person[]` – Global people pool.
    -   `nextProjectId: number` – Derived from existing IDs.
    -   `isPreferencesOpen: boolean` – Preferences modal visibility.
    -   `appWallpaper: string | null` – Data URL; applied to `document.body.style.backgroundImage`.
    -   `searchTerm: string`, `searchIndex: lunr.Index | null` – Search state.
    -   `dataLoaded: boolean` – Set after initial IndexedDB load attempt (success or error path).

-   Persistence (IndexedDB; `src/utils/indexedDB.ts`):

    -   DB name: `ProjectPulseDB` (note the naming inconsistency with TrueTrack).
    -   Store: `appData` with `keyPath: 'key'`.
    -   Helpers: `idbGet<T>(key)`, `idbSet(key, value)`, `idbRemove(key)`.
    -   Keys used by `App.tsx`:
        -   `projectsData` → `Project[]`
        -   `globalPeopleData` → `Person[]`
        -   `appWallpaper` → `string` (data URL)

-   Initial load (`useEffect`):

    -   Reads `projectsData`, `appWallpaper`, `globalPeopleData`.
    -   Normalizes `taskColor` and converts any `reminder` to ISO string.
    -   Seeds `globalPeopleData` with a default list on first run if empty.
    -   Sets `dataLoaded` when finished (including error fallback).

-   Save/sync (`useEffect` on `[projects, globalPeople, dataLoaded]`):

    -   Writes/removes `projectsData` and `globalPeopleData` in IndexedDB depending on emptiness.
    -   Triggers `syncData()` if online.

-   Wallpaper (`useEffect` on `[appWallpaper, dataLoaded]`):

    -   Saves/removes `appWallpaper` in IndexedDB.
    -   Applies/removes `document.body` background image.

-   Search index (`useEffect` on `[projects]`):
    -   Rebuilds a Lunr index using fields: `id` (ref), `title`, `tasks` (concatenated task titles and item texts).
    -   Query pattern: `*${searchTerm}*` for fuzzy matching.

### Component responsibilities

-   `AppHeader`

    -   Logo (from `src/assets/truetrack-logo.png`).
    -   Collapsible search input; emits `onSearchChange`.
    -   Buttons: Add Project, Preferences.
    -   Uses Tippy for tooltips; FontAwesome for icons; CSS Modules for styling.

-   `PreferencesDialog`

    -   Sections: General (wallpaper upload/preview), Data Management (Backup/Restore tabs).
    -   Backup: reads all records from `appData`, encrypts with passphrase, downloads as `project-pulse-backup.txt`.
    -   Restore: reads `.txt`, decrypts with passphrase, clears store, re-inserts records.
    -   Uses `cryptoUtils` for encryption/decryption, `dataUtils` for IndexedDB operations.

-   `ProjectLane`
    -   Displays one project with its tasks and task items.
    -   Features: inline task title editing (double-click), add/delete tasks, add/delete/toggle items, archive toggle, person tagging (with suggestions), reminder set/edit/clear (DateTimePicker + Calendar portal), color presets and picker in edit dialog, project reordering.
    -   Visual highlights of search `highlightTerm` in titles and items.
    -   Note: Some dynamic styles are applied inline via `style={...}` for borders/backgrounds.

### Styling

-   Global styles: `src/index.css` and `src/App.module.css` (contains app layout and some generic classes).
-   CSS Modules: `AppHeader.module.css`, `ProjectLane.module.css`, `PreferencesDialog.module.css`.
-   Tooltips: `src/components/TooltipStyles.css` defines a custom Tippy theme `material`.
-   Fonts: Google Fonts `Montserrat Alternates` loaded in global CSS.

Important: Existing code uses a few inline React style objects (e.g., in `ProjectLane.tsx`) for dynamic colors. Avoid introducing new inline styles; prefer CSS classes and modules unless dynamic styling is unavoidable.

### Encryption and backup details (`src/utils/cryptoUtils.ts`)

-   Library: `crypto-js`.
-   Key derivation: PBKDF2 with `ITERATIONS = 100`, key size 256 bits, random 16-byte salt.
-   Cipher: AES-CBC with PKCS7 padding (despite comments referencing GCM).
-   Output format: `saltHex:ivHex:cipherTextHex`.
-   Decryption splits by `:`, re-derives key, decrypts, and returns UTF-8 string. Empty result implies failure.

Naming/UX inconsistencies to be aware of:

-   DB name is `ProjectPulseDB`, and backup file name is `project-pulse-backup.txt` while app branding is TrueTrack.
-   Crypto comments mention AES-GCM but implementation uses AES-CBC.

### Backend service (`truetrack-backend`)

-   Fastify server (`src/index.ts`) with:
    -   `GET /` → `{ hello: 'world' }`
    -   `POST /sync` → appends arbitrary `request.body` to `db.json` (array) and returns 201.
    -   `GET /sync` → returns entire array from `db.json`.
-   File location: `db.json` in backend root (`truetrack-backend/db.json`).
-   Build/run: `npm run build` → emit to `dist`, `npm start` runs `dist/index.js`; `npm run dev` uses `nodemon` + `ts-node`.
-   CORS: Not enabled. Frontend `fetch('http://localhost:3000/sync')` will be cross-origin during Vite dev; expect CORS failures unless adjusted (enable `@fastify/cors` or proxy via Vite).
-   No validation/auth; data model is opaque; append-only growth.

### Search mechanics

-   Index fields: `title`, `tasks` (task title + concatenated item texts). Reference is `project.id`.
-   Rebuilt whenever `projects` changes; if many projects/items, consider debounce or incremental updates.
-   Query uses wildcard-wrapped term; errors are caught and return empty results.

### Key behaviors and edge cases

-   ID generation:
    -   Projects: `project-<nextProjectId>`; `nextProjectId` recalculated from existing IDs on state changes.
    -   Tasks: `task-${projectId}-${Date.now()}`; Items: `crypto.randomUUID()`.
-   Positioning: `position` is maintained and re-sequenced on deletions and reorders.
-   Reminders: stored as ISO strings; DateTimePicker and Calendar allow editing date/time separately; calendar portal is positioned absolutely on `document.body`.
-   Offline behavior: If `navigator.onLine` is false, sync is skipped; local persistence continues to work.
-   Error handling: IndexedDB operations log to console and fall back to empty state; fetch errors logged.

### Dependencies (selected)

-   React 19, Vite 6, TypeScript ~5.8.
-   UI: `@tippyjs/react`, `@fortawesome/*`, `react-datetime-picker` (+ `react-calendar`, `react-clock`), `react-colorful`.
-   Data/utility: `lunr`, `date-fns`, `crypto-js`.
-   Dev: ESLint 9, TypeScript ESLint, Vite React plugin, Single-file plugin.

### Conventions and guidelines for future changes

-   Types first: Update `src/types/index.ts` before changing persisted shapes. Ensure `App.tsx` normalization handles new/changed fields.
-   Persistence keys: Keep using `projectsData`, `globalPeopleData`, `appWallpaper` unless there is a formal migration. If keys change, provide migration logic during initial load.
-   Avoid inline styles; prefer CSS Modules. If dynamic theming is needed, consider data-attributes or CSS variables.
-   Search index: If you add searchable fields, update both index creation and search query format.
-   Reminders: Keep storing as ISO strings for consistency; guard Date parsing.
-   Backend sync: If structure changes, define a schema and validate on the server. Consider enabling CORS or a Vite dev proxy.
-   Error handling: Maintain user-safe fallbacks; do not throw uncaught exceptions inside effects.
-   Accessibility: Preserve keyboard interactions already present (Enter/Escape handling in editors).

### Potential risks and follow-ups (do not execute without explicit task)

-   CORS likely needed for dev (`@fastify/cors`) or set up Vite proxy to `/sync`.
-   Crypto mode comment mismatch (CBC vs GCM) and low PBKDF2 iteration count; consider stronger defaults if security is a priority.
-   Naming consistency: TrueTrack vs ProjectPulse across DB name and backup filenames.
-   Backend stores unbounded array in `db.json`; could grow large without rotation.
-   Search performance: Rebuilding index on every change may be heavy with large datasets.

### Quick reference: where things happen

-   App initialization and data load: `src/App.tsx` (effects around data load, wallpaper, index build).
-   Save to IDB and backend sync: `src/App.tsx` (effect saving and calling `syncData`).
-   Search index build and query: `src/App.tsx` (Lunr-related effects and memo).
-   Project/task CRUD handlers: `src/App.tsx` (`handleAddProject`, `handleDeleteProject`, `handleUpdateTask`, etc.).
-   Header search UI: `src/components/AppHeader/AppHeader.tsx`.
-   Preferences backup/restore: `src/components/PreferencesDialog/PreferencesDialog.tsx`.
-   Project lane UI, reminders, people tagging: `src/components/ProjectLane.tsx` and `ProjectLane.module.css`.
-   IndexedDB wrapper: `src/utils/indexedDB.ts`.
-   Encryption helpers: `src/utils/cryptoUtils.ts`.
-   Backend endpoints: `truetrack-backend/src/index.ts`.

### Environment and ports

-   Frontend dev: Vite default (5173). Backend: Fastify on 3000. Cross-origin requests will require CORS or a dev proxy.

### Notes for CI/linting

-   ESLint is configured; TypeScript is strict with `noUnusedLocals/Parameters` enabled. Address lints as part of changes.
