import Fastify from 'fastify';
import { promises as fs } from 'fs';
import path from 'path';

const server = Fastify({
  logger: true
});

const dbPath = path.join(__dirname, '..', 'db.json');

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

const start = async () => {
  try {
    await server.listen({ port: 3000 });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
