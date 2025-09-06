"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const server = (0, fastify_1.default)({
    logger: true
});
// Register CORS plugin
server.register(require('@fastify/cors'), {
    origin: true
});
const dbPath = path_1.default.join(__dirname, '..', 'db.json');
const notesDbPath = path_1.default.join(__dirname, '..', 'notes.json');
const readDb = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield fs_1.promises.access(dbPath);
    }
    catch (error) {
        yield fs_1.promises.writeFile(dbPath, JSON.stringify([]));
    }
    const data = yield fs_1.promises.readFile(dbPath, 'utf-8');
    return JSON.parse(data);
});
const writeDb = (data) => __awaiter(void 0, void 0, void 0, function* () {
    yield fs_1.promises.writeFile(dbPath, JSON.stringify(data, null, 2));
});
const readNotesDb = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield fs_1.promises.access(notesDbPath);
    }
    catch (error) {
        yield fs_1.promises.writeFile(notesDbPath, JSON.stringify([]));
    }
    const data = yield fs_1.promises.readFile(notesDbPath, 'utf-8');
    return JSON.parse(data);
});
const writeNotesDb = (data) => __awaiter(void 0, void 0, void 0, function* () {
    yield fs_1.promises.writeFile(notesDbPath, JSON.stringify(data, null, 2));
});
server.get('/', (request, reply) => __awaiter(void 0, void 0, void 0, function* () {
    return { hello: 'world' };
}));
server.post('/sync', (request, reply) => __awaiter(void 0, void 0, void 0, function* () {
    const newData = request.body;
    const dbData = yield readDb();
    dbData.push(newData);
    yield writeDb(dbData);
    reply.code(201).send({ message: 'Data saved' });
}));
server.get('/sync', (request, reply) => __awaiter(void 0, void 0, void 0, function* () {
    const dbData = yield readDb();
    reply.send(dbData);
}));
// Notes endpoints
server.post('/notes', (request, reply) => __awaiter(void 0, void 0, void 0, function* () {
    const newNote = request.body;
    const notesData = yield readNotesDb();
    notesData.push(newNote);
    yield writeNotesDb(notesData);
    reply.code(201).send({ message: 'Note saved', note: newNote });
}));
server.get('/notes', (request, reply) => __awaiter(void 0, void 0, void 0, function* () {
    const notesData = yield readNotesDb();
    reply.send(notesData);
}));
server.put('/notes/:id', (request, reply) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = request.params;
    const updatedNote = request.body;
    const notesData = yield readNotesDb();
    const noteIndex = notesData.findIndex((note) => note.id === id);
    if (noteIndex === -1) {
        reply.code(404).send({ error: 'Note not found' });
        return;
    }
    notesData[noteIndex] = Object.assign(Object.assign({}, notesData[noteIndex]), updatedNote);
    yield writeNotesDb(notesData);
    reply.send({ message: 'Note updated', note: notesData[noteIndex] });
}));
server.delete('/notes/:id', (request, reply) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = request.params;
    const notesData = yield readNotesDb();
    const filteredNotes = notesData.filter((note) => note.id !== id);
    if (filteredNotes.length === notesData.length) {
        reply.code(404).send({ error: 'Note not found' });
        return;
    }
    yield writeNotesDb(filteredNotes);
    reply.send({ message: 'Note deleted' });
}));
const start = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield server.listen({ port: 3000 });
    }
    catch (err) {
        server.log.error(err);
        process.exit(1);
    }
});
start();
//# sourceMappingURL=index.js.map