import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import express from 'express';
import request from 'supertest';

import { createRouter } from '../../routes/router.js';
import { createFakeDb } from '../helpers/fakeDb.js';

function createWebTestApp(db, userId = 'u1') {
  const app = express();
  app.set('view engine', 'ejs');
  app.set('views', path.resolve(process.cwd(), 'views'));
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());

  const authController = {
    login_post: (_req, res) => res.status(501).json({ error: 'not used in tests' }),
    signup_post: (_req, res) => res.status(501).json({ error: 'not used in tests' }),
    logout_get: (_req, res) => res.redirect('/'),
  };

  app.use('/', createRouter(db, {
    checkUserMiddleware: (_req, res, next) => {
      res.locals.user = { _id: userId };
      next();
    },
    requireAuthMiddleware: (req, _res, next) => {
      req.user = { _id: userId };
      next();
    },
    authController,
  }));

  return app;
}

describe('web acceptance', () => {
  it('GET / renders the home page', async () => {
    const app = createWebTestApp(createFakeDb());
    const res = await request(app).get('/');

    assert.equal(res.status, 200);
    assert.match(res.text, /<html|<!DOCTYPE html>/i);
  });

  it('POST /add creates a task then /listjson returns it', async () => {
    const db = createFakeDb();
    const app = createWebTestApp(db);

    const addRes = await request(app)
      .post('/add')
      .send('title=Acceptance+Task&priority=2&tags=work,school');

    assert.equal(addRes.status, 302);
    assert.equal(addRes.headers.location, '/list');

    const listRes = await request(app).get('/listjson');
    assert.equal(listRes.status, 200);
    assert.equal(listRes.body.length, 1);
    assert.equal(listRes.body[0].title, 'Acceptance Task');
  });

  it('PUT /edit updates task fields for ajax clients', async () => {
    const db = createFakeDb({ tasks: [{ _id: '1', title: 'Before', ownerId: 'u1', priority: 3, tags: [] }] });
    const app = createWebTestApp(db);

    const res = await request(app)
      .put('/edit')
      .set('Accept', 'application/json')
      .send({ id: '1', title: 'After', priority: '1', tags: 'urgent,home' });

    assert.equal(res.status, 200);
    assert.deepEqual(res.body, { ok: true });

    const task = await db.findOne('tasks', { _id: '1', ownerId: 'u1' });
    assert.equal(task.title, 'After');
    assert.equal(task.priority, 1);
    assert.deepEqual(task.tags, ['urgent', 'home']);
  });

  it('PUT /tasks/:id/subtask/:index toggles subtask completion', async () => {
    const db = createFakeDb({
      tasks: [{ _id: '1', title: 'Task', ownerId: 'u1', subtasks: [{ title: 'Sub', completed: false }] }],
    });
    const app = createWebTestApp(db);

    const res = await request(app)
      .put('/tasks/1/subtask/0')
      .send({ completed: true });

    assert.equal(res.status, 200);
    assert.equal(res.body.ok, true);

    const task = await db.findOne('tasks', { _id: '1', ownerId: 'u1' });
    assert.equal(task.subtasks[0].completed, true);
  });

  it('DELETE /delete removes task and /detail/:id returns 404', async () => {
    const db = createFakeDb({ tasks: [{ _id: '1', title: 'Task', ownerId: 'u1' }] });
    const app = createWebTestApp(db);

    const delRes = await request(app)
      .delete('/delete')
      .send({ _id: '1' });

    assert.equal(delRes.status, 200);
    assert.equal(delRes.body.ok, true);

    const detailRes = await request(app).get('/detail/1');
    assert.equal(detailRes.status, 404);
  });
});
