/**
 * API Routes - Express Router for Task CRUD Operations
 *
 * Handles all task-related API endpoints.
 * Works with any database through the ORDB abstraction layer.
 */

import express from 'express';
import { requireAuth } from '../db/middleware/authMiddleware.js'; // Import your middleware
import { createTaskWithRewards, updateTaskWithRewards } from '../util/rewards.js';

const COLLECTION = 'tasks';

/**
 * Normalizes a task payload from a request body.
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
 */
export function createApiRouter(db) {
  const router = express.Router();

  // Apply requireAuth to ALL API routes below
  router.use(requireAuth);

  // ─── Create ───────────────────────────────────────────────────────────────

  router.post('/tasks', async (req, res) => {
    const { data, error } = parseTaskBody(req.body, true);
    if (error) return res.status(400).json({ error });

    try {
      const task = await createTaskWithRewards(db, req.user._id, {
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

  router.get('/tasks', async (req, res) => {
    try {
      // Filter by ownerId
      const tasks = await db.findAll(
        COLLECTION, 
        { ownerId: req.user._id }, 
        { sort: { priority: 1, createdAt: 1 } }
      );
      res.json(tasks);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      res.status(500).json({ error: 'Failed to fetch tasks' });
    }
  });

  router.get('/tasks/:id', async (req, res) => {
    try {
      // Ensure the task belongs to the user
      const task = await db.findOne(COLLECTION, { _id: req.params.id, ownerId: req.user._id });
      if (!task) return res.status(404).json({ error: 'Task not found' });
      res.json(task);
    } catch (err) {
      console.error('Error fetching task:', err);
      res.status(500).json({ error: 'Failed to fetch task' });
    }
  });

  // ─── Update ───────────────────────────────────────────────────────────────

  router.put('/tasks/:id', async (req, res) => {
    const { data, error } = parseTaskBody(req.body);
    if (error) return res.status(400).json({ error });
    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    try {
      // Double check ownership during update
      const task = await updateTaskWithRewards(db, req.params.id, req.user._id, data);
      if (!task) return res.status(404).json({ error: 'Task not found' });
      res.json(task);
    } catch (err) {
      console.error('Error updating task:', err);
      res.status(500).json({ error: 'Failed to update task' });
    }
  });

  router.put('/tasks/:id/subtasks/:index', async (req, res) => {
    const { id, index } = req.params;
    const completed = req.body.completed === 'true' || req.body.completed === true;

    try {
      const task = await db.updateOne(
        COLLECTION,
        { _id: id, ownerId: req.user._id }, // Secure filter
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

  router.delete('/tasks/:id', async (req, res) => {
    try {
      // Only delete if ID and owner match
      const deleted = await db.deleteOne(COLLECTION, { _id: req.params.id, ownerId: req.user._id });
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