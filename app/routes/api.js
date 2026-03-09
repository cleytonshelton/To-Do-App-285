/**
 * API Routes - Express Router for Task CRUD Operations
 *
 * Handles all task-related API endpoints.
 * Works with any database through the ORDB abstraction layer.
 */

import express from 'express';

const COLLECTION = 'tasks';

/**
 * Normalizes a task payload from a request body.
 * @param {Object} body - Raw request body
 * @param {boolean} [requireTitle=false] - Whether to enforce title presence
 * @returns {{ data: Object|null, error: string|null }}
 */
function parseTaskBody(body = {}, requireTitle = false) {
  const { title, date, status, priority, subtasks } = body;

  if (requireTitle && !title?.trim()) {
    return { data: null, error: 'title is required' };
  }

  return {
    error: null,
    data: {
      ...(title    !== undefined && { title }),
      ...(date     !== undefined && { date: date || null }),
      ...(status   !== undefined && { status: status?.trim() || 'Pending' }),
      ...(priority !== undefined && { priority: parseInt(priority) }),
      ...(subtasks !== undefined && { subtasks: Array.isArray(subtasks) ? subtasks : [] }),
    },
  };
}

/**
 * Creates and configures the API router.
 * @param {Object} db - Database instance (ORDB bridge)
 * @returns {express.Router} Configured Express router
 */
export function createApiRouter(db) {
  const router = express.Router();

  // ─── Create ───────────────────────────────────────────────────────────────

  /**
   * POST /api/tasks
   * Creates a new task. Title is required.
   */
  router.post('/tasks', async (req, res) => {
    const { data, error } = parseTaskBody(req.body, true);
    if (error) return res.status(400).json({ error });

    try {
      const task = await db.insertOne(COLLECTION, {
        title:    data.title,
        date:     data.date     ?? null,
        status:   data.status   ?? 'Pending',
        priority: data.priority ?? 3,
        subtasks: data.subtasks ?? [],
      });
      res.status(201).json(task);
    } catch (err) {
      console.error('Error creating task:', err);
      res.status(500).json({ error: 'Failed to create task' });
    }
  });

  // ─── Read ─────────────────────────────────────────────────────────────────

  /**
   * GET /api/tasks
   * Returns all tasks sorted by priority then creation date.
   */
  router.get('/tasks', async (_req, res) => {
    try {
      const tasks = await db.findAll(COLLECTION, {}, { sort: { priority: 1, createdAt: 1 } });
      res.json(tasks);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      res.status(500).json({ error: 'Failed to fetch tasks' });
    }
  });

  /**
   * GET /api/tasks/:id
   * Returns a single task by ID.
   */
  router.get('/tasks/:id', async (req, res) => {
    try {
      const task = await db.findOne(COLLECTION, { _id: req.params.id });
      if (!task) return res.status(404).json({ error: 'Task not found' });
      res.json(task);
    } catch (err) {
      console.error('Error fetching task:', err);
      res.status(500).json({ error: 'Failed to fetch task' });
    }
  });

  // ─── Update ───────────────────────────────────────────────────────────────

  /**
   * PUT /api/tasks/:id
   * Updates a task's fields. At least one field must be provided.
   */
  router.put('/tasks/:id', async (req, res) => {
    const { data, error } = parseTaskBody(req.body);
    if (error) return res.status(400).json({ error });
    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    try {
      const task = await db.updateOne(COLLECTION, { _id: req.params.id }, data);
      if (!task) return res.status(404).json({ error: 'Task not found' });
      res.json(task);
    } catch (err) {
      console.error('Error updating task:', err);
      res.status(500).json({ error: 'Failed to update task' });
    }
  });

  /**
   * PUT /api/tasks/:id/subtasks/:index
   * Toggles the completed state of a single subtask.
   */
  router.put('/tasks/:id/subtasks/:index', async (req, res) => {
    const { id, index } = req.params;
    const completed = req.body.completed === 'true' || req.body.completed === true;

    try {
      const task = await db.updateOne(
        COLLECTION,
        { _id: id },
        { [`subtasks.${index}.completed`]: completed }
      );
      if (!task) return res.status(404).json({ error: 'Task not found' });
      res.json({ ok: true, task });
    } catch (err) {
      console.error('Error toggling subtask:', err);
      res.status(500).json({ error: 'Failed to toggle subtask' });
    }
  });

  // ─── Delete ───────────────────────────────────────────────────────────────

  /**
   * DELETE /api/tasks/:id
   * Deletes a task by ID.
   */
  router.delete('/tasks/:id', async (req, res) => {
    try {
      const deleted = await db.deleteOne(COLLECTION, { _id: req.params.id });
      if (!deleted) return res.status(404).json({ error: 'Task not found' });
      res.json({ ok: true, deletedId: req.params.id });
    } catch (err) {
      console.error('Error deleting task:', err);
      res.status(500).json({ error: 'Failed to delete task' });
    }
  });

  return router;
}

export default { createApiRouter };