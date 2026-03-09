/**
 * View Routes - Express Router for EJS Templates
 *
 * Handles all view-related routes that render EJS templates.
 * Works with any database through the ORDB abstraction layer.
 */

import express from 'express';

const COLLECTION = 'tasks';

/**
 * Parses subtasks from a form submission body.
 * @param {Object} subtasks - Raw subtasks from req.body
 * @param {boolean} [withCompleted=false] - Whether to include the completed field
 * @returns {Array} Parsed subtask array
 */
function parseSubtasks(subtasks, withCompleted = false) {
  if (!subtasks) return [];
  return Object.values(subtasks).map(sub =>
    withCompleted
      ? { title: sub.title, completed: sub.completed === 'true' || sub.completed === true }
      : sub
  );
}

/**
 * Creates and configures the view router.
 * @param {Object} db - Database instance (ORDB bridge)
 * @returns {express.Router} Configured Express router
 */
export function createRouter(db) {
  const router = express.Router();

  // ─── Pages ────────────────────────────────────────────────────────────────

  router.get('/', (_req, res) => res.render('home.ejs'));

  router.get('/write', (_req, res) => res.render('write.ejs'));

  router.get('/calendar', (_req, res) => res.render('calendar.ejs'));

  router.get('/dashboard', (_req, res) => res.render('dashboard.ejs'));

  // ─── Tasks ────────────────────────────────────────────────────────────────

  router.get('/list', async (_req, res) => {
    try {
      const tasks = await db.findAll(COLLECTION, {}, { sort: { createdAt: 1 } });
      res.render('list.ejs', { posts: tasks });
    } catch (err) {
      console.error('Error fetching tasks:', err);
      res.status(500).send('Failed to fetch tasks');
    }
  });

  router.get('/listjson', async (_req, res) => {
    try {
      const tasks = await db.findAll(COLLECTION);
      res.json(tasks);
    } catch (err) {
      console.error('Error fetching tasks as JSON:', err);
      res.status(500).json({ error: 'Failed to fetch tasks' });
    }
  });

  router.get('/detail/:id', async (req, res) => {
    try {
      const data = await db.findOne(COLLECTION, { _id: req.params.id });
      if (!data) return res.status(404).send('Task not found');
      res.render('detail.ejs', { data });
    } catch (err) {
      console.error('Error fetching task detail:', err);
      res.status(500).send('Error fetching task detail');
    }
  });

  router.post('/add', async (req, res) => {
    try {
      const { title, date, status, priority, subtasks } = req.body;
      await db.insertOne(COLLECTION, {
        title:    title    || '',
        date:     date     || null,
        status:   status   || 'Pending',
        priority: parseInt(priority) || 3,
        subtasks: parseSubtasks(subtasks),
      });
      res.redirect('/list');
    } catch (err) {
      console.error('Error adding task:', err);
      res.status(500).send('Failed to add task');
    }
  });

  router.get('/edit/:id', async (req, res) => {
    try {
      const data = await db.findOne(COLLECTION, { _id: req.params.id });
      if (!data) return res.status(404).send('Task not found');
      res.render('edit.ejs', { data });
    } catch (err) {
      console.error('Error fetching task for editing:', err);
      res.status(500).send('Error fetching task for editing');
    }
  });

  router.put('/edit', async (req, res) => {
    try {
      const { id, title, date, status, priority, subtasks } = req.body;

      const updateData = {
        ...(title    !== undefined && { title }),
        ...(date     !== undefined && { date }),
        ...(status   !== undefined && { status }),
        ...(priority !== undefined && { priority: parseInt(priority) }),
        ...(subtasks !== undefined && { subtasks: parseSubtasks(subtasks, true) }),
      };

      await db.updateOne(COLLECTION, { _id: id }, updateData);

      const isAjax = req.xhr || req.headers.accept?.includes('json');
      return isAjax ? res.json({ ok: true }) : res.redirect('/list');
    } catch (err) {
      console.error('Error updating task:', err);
      res.status(500).send('Failed to update task');
    }
  });

  router.put('/tasks/:id/subtask/:index', async (req, res) => {
    try {
      const { id, index } = req.params;
      const completed = req.body.completed === 'true' || req.body.completed === true;

      const updatedTask = await db.updateOne(
        COLLECTION,
        { _id: id },
        { [`subtasks.${index}.completed`]: completed }
      );

      if (!updatedTask) return res.status(404).json({ error: 'Task not found' });
      res.json({ ok: true, updatedTask });
    } catch (err) {
      console.error('Error toggling subtask:', err);
      res.status(500).json({ error: 'Failed to toggle subtask' });
    }
  });

  router.delete('/delete', async (req, res) => {
    try {
      const { _id } = req.body;
      const deleted = await db.deleteOne(COLLECTION, { _id });
      if (!deleted) return res.status(404).json({ error: 'Task not found' });
      res.json({ ok: true, deletedId: _id });
    } catch (err) {
      console.error('Error deleting task:', err);
      res.status(500).json({ error: 'Failed to delete task' });
    }
  });

  return router;
}

export default { createRouter };