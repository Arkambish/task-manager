import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule, RATE_LIMIT } from '../src/app.module.js';
import { configureApp } from '../src/configure-app.js';

// These tests call the API the way a client does: over HTTP, through the
// same validation pipe the real server uses (configureApp).
describe('Tasks API (e2e)', () => {
  let app: INestApplication<App>;

  // A new app per test means a new, empty in-memory store per test.
  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  const api = () => request(app.getHttpServer());

  /** Creates a task and returns it as the API returned it. */
  async function createTask(body: object = { title: 'Write docs' }) {
    const response = await api().post('/tasks').send(body).expect(201);
    return response.body;
  }

  describe('POST /tasks', () => {
    it('creates a task with defaults when only a title is sent', async () => {
      const task = await createTask({ title: 'Write docs' });

      expect(task).toEqual({
        id: expect.any(String),
        title: 'Write docs',
        description: null,
        status: 'TODO',
        dueDate: null,
        createdAt: expect.any(String),
      });
    });

    it('creates a task with every field', async () => {
      const task = await createTask({
        title: 'Write docs',
        description: 'Setup guide',
        status: 'IN_PROGRESS',
        dueDate: '2026-12-04',
      });

      expect(task).toMatchObject({
        description: 'Setup guide',
        status: 'IN_PROGRESS',
        dueDate: '2026-12-04',
      });
    });

    it('trims the title', async () => {
      const task = await createTask({ title: '  Write docs  ' });

      expect(task.title).toBe('Write docs');
    });

    it.each([
      ['title is missing', {}],
      ['title is null', { title: null }],
      ['title is only spaces', { title: '   ' }],
      ['title is not a string', { title: 42 }],
      ['title is longer than 120 characters', { title: 'a'.repeat(121) }],
      ['status is not a known value', { title: 'x', status: 'BLOCKED' }],
      ['status is null', { title: 'x', status: null }],
      [
        'dueDate is a timestamp',
        { title: 'x', dueDate: '2026-12-04T10:00:00Z' },
      ],
      ['dueDate is not a real date', { title: 'x', dueDate: '2026-02-30' }],
      ['dueDate is free text', { title: 'x', dueDate: 'tomorrow' }],
      ['an unknown property is sent', { title: 'x', id: 'my-own-id' }],
    ])('answers 400 when %s', async (_case, body) => {
      const response = await api().post('/tasks').send(body).expect(400);

      // Nest's validation error body: { statusCode, message: string[], error }
      expect(response.body.message).toEqual(expect.any(Array));
      expect(response.body.message.length).toBeGreaterThan(0);
    });

    it('stores nothing when the body is invalid', async () => {
      await api().post('/tasks').send({ title: '' }).expect(400);

      await api().get('/tasks').expect(200, []);
    });
  });

  describe('GET /tasks', () => {
    it('returns an empty list when there are no tasks', async () => {
      await api().get('/tasks').expect(200, []);
    });

    it('returns the newest task first', async () => {
      const first = await createTask({ title: 'First' });
      const second = await createTask({ title: 'Second' });

      await api().get('/tasks').expect(200, [second, first]);
    });
  });

  describe('GET /tasks/:id', () => {
    it('returns the task', async () => {
      const task = await createTask();

      await api().get(`/tasks/${task.id}`).expect(200, task);
    });

    it('answers 404 when the task does not exist', async () => {
      const response = await api().get('/tasks/does-not-exist').expect(404);

      expect(response.body.message).toBe(
        'Task not found. It may have been deleted.',
      );
    });
  });

  describe('PATCH /tasks/:id', () => {
    it('changes only the fields that are sent', async () => {
      const task = await createTask({
        title: 'Write docs',
        description: 'Setup guide',
        dueDate: '2026-12-04',
      });

      await api()
        .patch(`/tasks/${task.id}`)
        .send({ status: 'DONE' })
        .expect(200, { ...task, status: 'DONE' });
    });

    it('clears description and dueDate when they are null', async () => {
      const task = await createTask({
        title: 'Write docs',
        description: 'Setup guide',
        dueDate: '2026-12-04',
      });

      await api()
        .patch(`/tasks/${task.id}`)
        .send({ description: null, dueDate: null })
        .expect(200, { ...task, description: null, dueDate: null });
    });

    it.each([
      ['title is null', { title: null }],
      ['title is empty', { title: '' }],
      ['status is not a known value', { status: 'BLOCKED' }],
      ['status is null', { status: null }],
      ['dueDate is not a real date', { dueDate: '2026-13-01' }],
      ['an unknown property is sent', { createdAt: '2020-01-01' }],
    ])('answers 400 when %s', async (_case, body) => {
      const task = await createTask();

      await api().patch(`/tasks/${task.id}`).send(body).expect(400);

      // The stored task is unchanged.
      await api().get(`/tasks/${task.id}`).expect(200, task);
    });

    it('answers 404 when the task does not exist', async () => {
      await api()
        .patch('/tasks/does-not-exist')
        .send({ title: 'New title' })
        .expect(404);
    });
  });

  describe('DELETE /tasks/:id', () => {
    it('deletes the task and answers 204 with no body', async () => {
      const task = await createTask();

      await api().delete(`/tasks/${task.id}`).expect(204, '');

      await api().get(`/tasks/${task.id}`).expect(404);
    });

    it('answers 404 when the task does not exist', async () => {
      await api().delete('/tasks/does-not-exist').expect(404);
    });
  });

  describe('rate limit', () => {
    it('answers 429 once a client goes over the limit', async () => {
      for (let count = 0; count < RATE_LIMIT.limit; count++) {
        await api().get('/tasks').expect(200);
      }

      const response = await api().get('/tasks').expect(429);

      expect(response.body.message).toBe(
        'Too many requests. Wait a moment, then try again.',
      );
    });
  });

  describe('CORS', () => {
    it('allows the configured web origin', async () => {
      const response = await api()
        .get('/tasks')
        .set('Origin', 'http://localhost:3000')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe(
        'http://localhost:3000',
      );
    });

    it('does not allow other origins', async () => {
      const response = await api()
        .get('/tasks')
        .set('Origin', 'http://evil.example')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBeUndefined();
    });
  });
});
