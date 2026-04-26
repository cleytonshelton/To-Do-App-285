import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';

import { createApiRouter } from '../../routes/api.js';
import { createFakeDb } from '../helpers/fakeDb.js';

function createApiTestApp(db, userId = 'u1') {
  const app = express();
  app.use(express.json());
  app.use('/api', createApiRouter(db, {
    requireAuthMiddleware: (req, _res, next) => {
      req.user = { _id: userId };
      next();
    },
  }));
  return app;
}

describe('api integration', () => {
  it('POST /api/tasks creates a task for the authenticated user', async () => {
    const db = createFakeDb();
    const app = createApiTestApp(db);

    const res = await request(app).post('/api/tasks').send({ title: 'New Task', priority: '1' });

    assert.equal(res.status, 201);
    assert.equal(res.body.title, 'New Task');
    assert.equal(res.body.ownerId, 'u1');
  });

  it('POST /api/tasks returns 400 when title is missing', async () => {
    const db = createFakeDb();
    const app = createApiTestApp(db);

    const res = await request(app).post('/api/tasks').send({ priority: 2 });

    assert.equal(res.status, 400);
    assert.equal(res.body.error, 'title is required');
  });

  it('GET /api/tasks returns only tasks owned by the user', async () => {
    const db = createFakeDb({
      tasks: [
        { _id: '1', title: 'Mine', ownerId: 'u1', priority: 1, createdAt: '2025-01-01' },
        { _id: '2', title: 'Other', ownerId: 'u2', priority: 1, createdAt: '2025-01-01' },
      ],
    });
    const app = createApiTestApp(db);

    const res = await request(app).get('/api/tasks');

    assert.equal(res.status, 200);
    assert.equal(res.body.length, 1);
    assert.equal(res.body[0].title, 'Mine');
  });

  it('GET /api/tasks/:id returns 404 when task does not exist', async () => {
    const db = createFakeDb();
    const app = createApiTestApp(db);

    const res = await request(app).get('/api/tasks/999');

    assert.equal(res.status, 404);
    assert.equal(res.body.error, 'Task not found');
  });

  it('PUT /api/tasks/:id updates an owned task', async () => {
    const db = createFakeDb({ tasks: [{ _id: '1', title: 'Before', ownerId: 'u1', priority: 3 }] });
    const app = createApiTestApp(db);

    const res = await request(app).put('/api/tasks/1').send({ title: 'After', status: 'Completed' });

    assert.equal(res.status, 200);
    assert.equal(res.body.title, 'After');
    assert.equal(res.body.status, 'Completed');
  });

  it('PUT /api/tasks/:id/subtasks/:index toggles subtask completion', async () => {
    const db = createFakeDb({
      tasks: [
        {
          _id: '1',
          title: 'Task',
          ownerId: 'u1',
          subtasks: [{ title: 'Subtask', completed: false }],
        },
      ],
    });
    const app = createApiTestApp(db);

    const res = await request(app)
      .put('/api/tasks/1/subtasks/0')
      .send({ completed: 'true' });

    assert.equal(res.status, 200);
    assert.equal(res.body.ok, true);
    assert.equal(res.body.task.subtasks[0].completed, true);
  });

  it('DELETE /api/tasks/:id deletes an owned task', async () => {
    const db = createFakeDb({ tasks: [{ _id: '1', title: 'Delete me', ownerId: 'u1' }] });
    const app = createApiTestApp(db);

    const res = await request(app).delete('/api/tasks/1');

    assert.equal(res.status, 200);
    assert.equal(res.body.ok, true);
    assert.equal(res.body.deletedId, '1');
  });

  it('PUT /api/settings/theme updates the authenticated user theme', async () => {
    const db = createFakeDb({ users: [{ _id: 'u1', preferences: { theme: 'light' } }] });
    const app = createApiTestApp(db);

    const res = await request(app).put('/api/settings/theme').send({ theme: 'ocean' });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.theme, 'ocean');
  });

  it('PUT /api/settings/theme rejects invalid theme values', async () => {
    const db = createFakeDb({ users: [{ _id: 'u1', preferences: { theme: 'light' } }] });
    const app = createApiTestApp(db);

    const res = await request(app).put('/api/settings/theme').send({ theme: 'neon-space' });

    assert.equal(res.status, 400);
    assert.equal(res.body.error, 'Invalid theme choice');
  });
});
