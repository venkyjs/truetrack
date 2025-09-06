import Fastify from 'fastify';
import { promises as fs } from 'fs';
import path from 'path';

const server = Fastify({
    logger: true
});

// Register CORS plugin
server.register(require('@fastify/cors'), {
    origin: true
});

const dbPath = path.join(__dirname, '..', 'db.json');
const notesDbPath = path.join(__dirname, '..', 'notes.json');

const readDb = async () => {
    try {
        await fs.access(dbPath);
    } catch (error) {
        await fs.writeFile(dbPath, JSON.stringify([]));
    }
    const data = await fs.readFile(dbPath, 'utf-8');
    return JSON.parse(data);
};

const writeDb = async (data: any) => {
    await fs.writeFile(dbPath, JSON.stringify(data, null, 2));
};

const readNotesDb = async () => {
    try {
        await fs.access(notesDbPath);
    } catch (error) {
        await fs.writeFile(notesDbPath, JSON.stringify([]));
    }
    const data = await fs.readFile(notesDbPath, 'utf-8');
    return JSON.parse(data);
};

const writeNotesDb = async (data: any) => {
    await fs.writeFile(notesDbPath, JSON.stringify(data, null, 2));
};

server.get('/', async (request, reply) => {
    return { hello: 'world' };
});

server.post('/sync', async (request, reply) => {
    const newData = request.body;
    const dbData = await readDb();
    dbData.push(newData);
    await writeDb(dbData);
    reply.code(201).send({ message: 'Data saved' });
});

server.get('/sync', async (request, reply) => {
    const dbData = await readDb();
    reply.send(dbData);
});

// Notes endpoints
server.post('/notes', async (request, reply) => {
    const newNote = request.body;
    const notesData = await readNotesDb();
    notesData.push(newNote);
    await writeNotesDb(notesData);
    reply.code(201).send({ message: 'Note saved', note: newNote });
});

server.get('/notes', async (request, reply) => {
    const notesData = await readNotesDb();
    reply.send(notesData);
});

server.put('/notes/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const updatedNote = request.body as any;
    const notesData = await readNotesDb();
    const noteIndex = notesData.findIndex((note: any) => note.id === id);

    if (noteIndex === -1) {
        reply.code(404).send({ error: 'Note not found' });
        return;
    }

    notesData[noteIndex] = { ...notesData[noteIndex], ...updatedNote };
    await writeNotesDb(notesData);
    reply.send({ message: 'Note updated', note: notesData[noteIndex] });
});

server.delete('/notes/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const notesData = await readNotesDb();
    const filteredNotes = notesData.filter((note: any) => note.id !== id);

    if (filteredNotes.length === notesData.length) {
        reply.code(404).send({ error: 'Note not found' });
        return;
    }

    await writeNotesDb(filteredNotes);
    reply.send({ message: 'Note deleted' });
});

const start = async () => {
    try {
        await server.listen({ port: 3000 });
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};

start();
